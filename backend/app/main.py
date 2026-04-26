from contextlib import asynccontextmanager

import asyncio
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import IntegrityError
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import config
from app.core.storage import init_minio
from app.core.health import health_check_worker, perform_health_checks, state
from app.core.exceptions import UniThreadException

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

@app.exception_handler(UniThreadException)
async def unithread_exception_handler(request: Request, exc: UniThreadException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    simplified_errors = []
    for err in errors:
        loc = ".".join([str(x) for x in err.get("loc", []) if x != "body"])
        msg = err.get("msg", "Invalid value")
        simplified_errors.append(f"{loc}: {msg}" if loc else msg)
        
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request parameters",
                "details": simplified_errors
            }
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
                "details": None
            }
        }
    )

@app.exception_handler(IntegrityError)
async def sqlalchemy_integrity_error_handler(request: Request, exc: IntegrityError):
    # Log the exact DB error for debugging
    logger.error(f"Database Integrity Error: {exc}")
    return JSONResponse(
        status_code=409,
        content={
            "error": {
                "code": "CONFLICT",
                "message": "A database conflict occurred (e.g., duplicate entry or foreign key violation).",
                "details": None
            }
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred.",
                "details": None
            }
        }
    )

from app.routes.api import api_router
app.include_router(api_router)
