from contextlib import asynccontextmanager

import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import config
from app.core.storage import init_minio
from app.core.health import health_check_worker, perform_health_checks, state

logger = logging.getLogger("uvicorn.error")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_minio()
    
    await perform_health_checks()
    
    bg_task = asyncio.create_task(health_check_worker())
    
    yield
    
    bg_task.cancel()

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
async def health_check():
    db_ok = state.db_ok
    minio_ok = state.minio_ok
    
    if db_ok and minio_ok:
        status = "ok"
    elif db_ok and not minio_ok:
        status = "degraded"
    else:
        status = "down"
    
    return {
        "status": status, 
        "project": config.PROJECT_NAME,
        "services": {
            "database": "up" if db_ok else "down",
            "minio": "up" if minio_ok else "down"
        },
        "last_checked": state.last_checked
    }
