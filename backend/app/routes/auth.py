import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Response, status, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

from app.core import security
from app.core.config import config
from app.core.dependencies import DbDep
from app.core.exceptions import (
    InvalidCredentialsException,
    UniversityNotFoundException,
    UserAlreadyExistsException,
)
from app.database.models.university import University
from app.database.models.user import User
from app.schemas.auth import (
    Token, 
    TokenData,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ResendVerificationRequest
)
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate, 
    background_tasks: BackgroundTasks, 
    db: DbDep
):
    domain = user_in.email.split("@")[-1]

    result = await db.execute(select(University).where(University.domain == domain))
    university = result.scalar_one_or_none()
    
    if not university:
        raise UniversityNotFoundException()

    result = await db.execute(
        select(User).where(
            (User.email == user_in.email) | (User.username == user_in.username)
        )
    )
    if result.first():
        raise UserAlreadyExistsException()

    hashed_password = security.get_password_hash(user_in.password)
    verification_token = secrets.token_urlsafe(32)

    new_user = User(
        email=user_in.email,
        username=user_in.username,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        password_hash=hashed_password,
        university_id=university.id,
        verification_token=verification_token,
        is_verified=False
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # TODO: Task #48 - send_email(new_user.email, "verify_email.html", token=verification_token)

    return new_user


@router.post("/login", response_model=Token)
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: DbDep = None,
):
    result = await db.execute(
        select(User).where(
            (User.email == form_data.username) | (User.username == form_data.username)
        )
    )
    user = result.scalar_one_or_none()

    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise InvalidCredentialsException()

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Te rugam sa iti verifici adresa de email inainte de a te loga."
        )

    token_data = TokenData(sub=str(user.id), username=user.username)
    access_token = security.create_access_token(token_data)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=config.COOKIE_SECURE,
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: DbDep
):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if user:
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
        
        user.reset_token = reset_token
        user.reset_token_expires_at = expires_at
        await db.commit()

        # TODO: Task #48 - send_email(user.email, "reset_password.html", token=reset_token)

    return {"message": "Daca adresa de email exista in sistemul nostru, vei primi un link pentru resetarea parolei."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request: ResetPasswordRequest,
    background_tasks: BackgroundTasks,
    db: DbDep
):
    # TODO: Rate Limit (max 3 requests/hour)
    
    result = await db.execute(select(User).where(User.reset_token == request.token))
    user = result.scalar_one_or_none()

    if not user or not user.reset_token_expires_at:
        raise HTTPException(status_code=400, detail="Token invalid sau folosit deja.")
    
    if user.reset_token_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token-ul a expirat.")

    user.password_hash = security.get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    await db.commit()

    # TODO: Task #48 - send_email(user.email, "password_changed.html")

    return {"message": "Parola a fost resetata cu succes."}


@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(
    token: str,
    background_tasks: BackgroundTasks,
    db: DbDep
):
    result = await db.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Token de verificare invalid.")

    if user.is_verified:
        return {"message": "Contul a fost deja verificat."}

    user.is_verified = True
    user.verification_token = None
    await db.commit()

    # TODO: Task #48 - send_email(user.email, "welcome.html")

    return {"message": "Adresa de email a fost verificata cu succes! Acum te poti loga."}


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification(
    request: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: DbDep
):
    # TODO: Rate Limit (1 request/5 min)

    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if user and not user.is_verified:
        new_token = secrets.token_urlsafe(32)
        user.verification_token = new_token
        await db.commit()

        # TODO: Task #48 - send_email(user.email, "verify_email.html", token=new_token)

    return {"message": "Daca emailul exista si nu a fost inca verificat, am trimis un nou link."}