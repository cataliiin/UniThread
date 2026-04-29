import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import text

from app.database.session import AsyncSessionLocal
from app.core.storage import check_minio_health
from app.core.config import config

logger = logging.getLogger("uvicorn.error")


class HealthState:
    db_ok: bool = False
    minio_ok: bool = False
    last_checked: str = None


state = HealthState()


async def perform_health_checks():
    minio_ok = await asyncio.to_thread(check_minio_health)

    db_ok = False
    try:
        async with AsyncSessionLocal() as session:
            await asyncio.wait_for(session.execute(text("SELECT 1")), timeout=3.0)
        db_ok = True
    except Exception as e:
        logger.error(f"DB health check failed: {e}")
        pass

    state.minio_ok = minio_ok
    state.db_ok = db_ok
    state.last_checked = datetime.now(timezone.utc).isoformat()


async def health_check_worker():
    while True:
        try:
            await perform_health_checks()
        except Exception as e:
            logger.error(f"Health check worker error: {e}")
        await asyncio.sleep(config.HEALTH_CHECK_INTERVAL)
