from pydantic import BaseModel, EmailStr, Field

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    sub: str | None = None
    username: str | None = None

    exp: int | None = None
    iat: int | None = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, description="Parola trebuie sa aiba minim 8 caractere")

class ResendVerificationRequest(BaseModel):
    email: EmailStr