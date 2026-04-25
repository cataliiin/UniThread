from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool, AsyncAdaptedQueuePool

from app.core.config import config

_is_sqlite = config.DATABASE_URL.startswith("sqlite")

def _resolve_url(url: str) -> str:
    if url.startswith("sqlite:///") and "+aiosqlite" not in url:
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

_database_url = _resolve_url(config.DATABASE_URL)

if _is_sqlite:
    engine = create_async_engine(
        _database_url,
        echo=config.DEBUG,
        poolclass=NullPool,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_async_engine(
        _database_url,
        echo=config.DEBUG,
        poolclass=AsyncAdaptedQueuePool,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
