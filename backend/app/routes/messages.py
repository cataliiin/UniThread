from uuid import UUID

from fastapi import APIRouter, Query, status
from sqlalchemy import case, func, select, update
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DbDep
from app.core.exceptions import ForbiddenException, UserNotFoundException
from app.database.models.messaging import Message, UserRelationship
from app.database.models.user import User
from app.schemas.messaging import MessageCreate, MessageResponse
from app.schemas.pagination import PaginatedResponse
from app.schemas.user import UserPublic

router = APIRouter(prefix="/messages", tags=["Messages"])


def to_message_response(message: Message) -> MessageResponse:
    return MessageResponse(
        id=message.id,
        sender_id=message.sender_id,
        recipient_id=message.recipient_id,
        content=message.content,
        is_read=message.is_read,
        created_at=message.created_at,
        sender=UserPublic.model_validate(message.sender),
        recipient=UserPublic.model_validate(message.recipient),
    )


async def get_tenant_user_or_404(target_id: UUID, current_user: User, db: DbDep) -> User:
    target_user = await db.scalar(
        select(User).where(
            (User.id == target_id)
            & (User.university_id == current_user.university_id)
        )
    )
    if not target_user:
        raise UserNotFoundException()
    return target_user


async def ensure_users_can_message(
    *, current_user_id: UUID, other_user_id: UUID, db: DbDep
) -> None:
    blocked_by_either_side = await db.scalar(
        select(UserRelationship.user_id)
        .where(
            (
                (UserRelationship.user_id == current_user_id)
                & (UserRelationship.target_user_id == other_user_id)
            )
            | (
                (UserRelationship.user_id == other_user_id)
                & (UserRelationship.target_user_id == current_user_id)
            )
        )
        .where(UserRelationship.is_blocked.is_(True))
        .limit(1)
    )
    if blocked_by_either_side:
        raise ForbiddenException(
            "Messaging is unavailable because one of these users has blocked the other."
        )


@router.post(
    "/{recipient_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_message(
    recipient_id: UUID,
    message_in: MessageCreate,
    current_user: CurrentUser,
    db: DbDep,
):
    """
    Send a direct message to another user in the same university tenant.
    """
    recipient = await get_tenant_user_or_404(recipient_id, current_user, db)
    await ensure_users_can_message(
        current_user_id=current_user.id,
        other_user_id=recipient.id,
        db=db,
    )

    message = Message(
        sender_id=current_user.id,
        recipient_id=recipient.id,
        content=message_in.content,
    )
    db.add(message)
    await db.flush()
    await db.commit()

    message.sender = current_user
    message.recipient = recipient
    return to_message_response(message)


@router.get("", response_model=list[MessageResponse])
async def list_recent_conversations(current_user: CurrentUser, db: DbDep):
    """
    Return the most recent message from each direct-message conversation.
    """
    participant_one = case(
        (Message.sender_id < Message.recipient_id, Message.sender_id),
        else_=Message.recipient_id,
    )
    participant_two = case(
        (Message.sender_id < Message.recipient_id, Message.recipient_id),
        else_=Message.sender_id,
    )
    same_tenant_user_ids = select(User.id).where(
        User.university_id == current_user.university_id
    )

    ranked_messages = (
        select(
            Message.id.label("message_id"),
            func.row_number()
            .over(
                partition_by=(participant_one, participant_two),
                order_by=(Message.created_at.desc(), Message.id.desc()),
            )
            .label("rn"),
        )
        .where(
            ((Message.sender_id == current_user.id) | (Message.recipient_id == current_user.id))
            & (Message.sender_id.in_(same_tenant_user_ids))
            & (Message.recipient_id.in_(same_tenant_user_ids))
        )
        .subquery()
    )

    messages = (
        await db.execute(
            select(Message)
            .join(ranked_messages, ranked_messages.c.message_id == Message.id)
            .where(ranked_messages.c.rn == 1)
            .options(selectinload(Message.sender), selectinload(Message.recipient))
            .order_by(Message.created_at.desc(), Message.id.desc())
        )
    ).scalars().all()

    return [to_message_response(message) for message in messages]


@router.get("/{other_user_id}", response_model=PaginatedResponse[MessageResponse])
async def get_message_history(
    other_user_id: UUID,
    current_user: CurrentUser,
    db: DbDep,
    page: int = Query(1, ge=1),
    size: int = Query(50),
):
    """
    Return paginated chat history with another user, newest messages first.
    Any unread incoming messages in that conversation are marked as read first.
    """
    other_user = await get_tenant_user_or_404(other_user_id, current_user, db)

    await db.execute(
        update(Message)
        .where(
            (Message.sender_id == other_user.id)
            & (Message.recipient_id == current_user.id)
            & (Message.is_read.is_(False))
        )
        .values(is_read=True)
    )
    await db.commit()

    actual_size = max(1, min(size, 100))
    offset = (page - 1) * actual_size

    base_query = select(Message).where(
        (
            (Message.sender_id == current_user.id)
            & (Message.recipient_id == other_user.id)
        )
        | (
            (Message.sender_id == other_user.id)
            & (Message.recipient_id == current_user.id)
        )
    )
    total = await db.scalar(select(func.count()).select_from(base_query.subquery()))

    messages = (
        await db.execute(
            base_query
            .options(selectinload(Message.sender), selectinload(Message.recipient))
            .order_by(Message.created_at.desc(), Message.id.desc())
            .offset(offset)
            .limit(actual_size)
        )
    ).scalars().all()

    pages = (total + actual_size - 1) // actual_size if total else 0
    return PaginatedResponse(
        items=[to_message_response(message) for message in messages],
        total=total or 0,
        page=page,
        size=actual_size,
        pages=pages,
    )
