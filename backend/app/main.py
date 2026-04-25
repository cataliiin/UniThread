from contextlib import asynccontextmanager

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import config
from app.core.dependencies import DbDep
from app.core.storage import init_minio, check_minio_health

logger = logging.getLogger("uvicorn.error")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_minio()
    yield

app = FastAPI(
    title=config.PROJECT_NAME,
    description=config.PROJECT_DESCRIPTION,
    lifespan=lifespan,
)

if config.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/health", tags=["Health"])
async def health_check(db: DbDep):
    minio_ok = check_minio_health()
    
    db_ok = False
    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass
    
    if db_ok and minio_ok:
        status = "ok"
        logger.info("Health check: All services UP")
    elif db_ok and not minio_ok:
        status = "degraded"
        logger.warning("Health check: MinIO is DOWN, Database is UP")
    else:
        status = "down"
        logger.error(f"Health check: Database is DOWN! MinIO OK: {minio_ok}")
    
    return {
        "status": status, 
        "project": config.PROJECT_NAME,
        "services": {
            "database": "up" if db_ok else "down",
            "minio": "up" if minio_ok else "down"
        }
    }
