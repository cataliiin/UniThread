from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

from app.core import security
from app.core.dependencies import DbDep
from app.core.exceptions import (
    InvalidCredentialsException,
    UniversityNotFoundException,
    UserAlreadyExistsException,
)
from app.database.models.university import University
from app.database.models.user import User
from app.schemas.auth import Token, TokenData
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate, db: DbDep):
    """
    Register a new user. The university is automatically inferred from the email domain.
    """
    domain = user_in.email.split("@")[-1]
    
    result = await db.execute(select(University).where(University.domain == domain))
    university = result.scalar_one_or_none()
    if not university:
        raise UniversityNotFoundException()
        
    result = await db.execute(select(User).where(
        (User.email == user_in.email) | (User.username == user_in.username)
    ))
    if result.first():
        raise UserAlreadyExistsException()
        
    hashed_password = security.get_password_hash(user_in.password)
    
    new_user = User(
        email=user_in.email,
        username=user_in.username,
        password_hash=hashed_password,
        university_id=university.id,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: DbDep = None # FastAPI unpacks Annotated even with default None or without it, but let's be clean
):
    """
    Standard OAuth2 login endpoint. Returns a JWT token and sets HTTPOnly cookie.
    """
    result = await db.execute(
        select(User).where((User.email == form_data.username) | (User.username == form_data.username))
    )
    user = result.scalar_one_or_none()
    
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise InvalidCredentialsException()
        
    token_data = TokenData(sub=str(user.id), username=user.username)
    access_token = security.create_access_token(token_data)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=60 * 60 * 24 * 7, # 7 days
        samesite="lax",
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
