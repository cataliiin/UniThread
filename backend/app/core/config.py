from pydantic_settings import BaseSettings, SettingsConfigDict

class Config(BaseSettings):
    PROJECT_NAME: str = "UniThread"
    PROJECT_DESCRIPTION: str
    DEBUG: bool = False

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

config = Config()