from uuid import UUID
from fastapi import APIRouter, status, Depends
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DbDep
from app.database.models.notification import Notification
from app.schemas.notification import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def to_notification_response(notif: Notification) -> NotificationResponse:
    sender_name = "Anonymous"
    sender_avatar = None
    if notif.sender:
        if notif.sender.first_name or notif.sender.last_name:
            sender_name = f"{notif.sender.first_name or ''} {notif.sender.last_name or ''}".strip()
        else:
            sender_name = notif.sender.username
        sender_avatar = notif.sender.avatar_key

    data = notif.data or {}
    return NotificationResponse(
        id=notif.id,
        sender_id=notif.sender_id,
        receiver_id=notif.receiver_id,
        type=notif.type,
        read=notif.read,
        created_at=notif.created_at,
        action_url=notif.action_url,
        sender_name=sender_name,
        sender_avatar=sender_avatar,
        post_id=data.get("post_id"),
        post_content=data.get("post_content"),
        community_id=data.get("community_id"),
        community_name=data.get("community_name"),
        community_icon=data.get("community_icon"),
        message=data.get("message") or data.get("post_content") or "",
    )


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(current_user: CurrentUser, db: DbDep):
    """
    List all notifications for the current logged-in user.
    """
    stmt = (
        select(Notification)
        .where(Notification.receiver_id == current_user.id)
        .options(selectinload(Notification.sender))
        .order_by(Notification.created_at.desc())
    )
    notifs = (await db.execute(stmt)).scalars().all()
    return [to_notification_response(n) for n in notifs]


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: UUID, current_user: CurrentUser, db: DbDep
):
    """
    Mark a single notification as read.
    """
    stmt = (
        select(Notification)
        .where(
            (Notification.id == notification_id)
            & (Notification.receiver_id == current_user.id)
        )
        .options(selectinload(Notification.sender))
    )
    notif = await db.scalar(stmt)
    if notif:
        notif.read = True
        db.add(notif)
        await db.commit()
        await db.refresh(notif)
        return to_notification_response(notif)
    
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Notification not found")


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_read(current_user: CurrentUser, db: DbDep):
    """
    Mark all notifications of the current user as read.
    """
    stmt = (
        update(Notification)
        .where(
            (Notification.receiver_id == current_user.id)
            & (Notification.read == False)
        )
        .values(read=True)
    )
    await db.execute(stmt)
    await db.commit()


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: UUID, current_user: CurrentUser, db: DbDep
):
    """
    Delete a notification.
    """
    stmt = (
        delete(Notification)
        .where(
            (Notification.id == notification_id)
            & (Notification.receiver_id == current_user.id)
        )
    )
    await db.execute(stmt)
    await db.commit()
