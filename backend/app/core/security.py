from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from app.schemas.auth import TokenData
from app.core.config import config

pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"], default="argon2", deprecated="auto"
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(
    token_data: TokenData, expires_delta: timedelta | None = None
) -> str:
    now = datetime.now(timezone.utc)
    if expires_delta is not None:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=config.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = token_data.model_dump(exclude_none=True)
    to_encode["iat"] = int(now.timestamp())
    to_encode["exp"] = int(expire.timestamp())
    return jwt.encode(to_encode, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)


def verify_token(token: str) -> TokenData | None:
    try:
        payload_dict = jwt.decode(
            token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM]
        )
        return TokenData(**payload_dict)
    except JWTError:
        return None
