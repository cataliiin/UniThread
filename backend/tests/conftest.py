from __future__ import annotations

import asyncio
import os
import shutil
import sys
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

_TEST_DB_DIR = Path(tempfile.mkdtemp(prefix="unithread-pytest-"))
_TEST_DB_PATH = _TEST_DB_DIR / "comments-test.db"

os.environ["PROJECT_DESCRIPTION"] = "UniThread backend pytest suite"
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ["JWT_SECRET_KEY"] = "pytest-secret-key"
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("DEBUG", "false")
os.environ.setdefault("COOKIE_SECURE", "false")

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402
from app.database.models import Base  # noqa: E402
from app.database.session import engine  # noqa: E402


def run_async(coro):
    return asyncio.run(coro)


@asynccontextmanager
async def noop_lifespan(_app):
    yield


app.router.lifespan_context = noop_lifespan


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_database():
    yield
    run_async(engine.dispose())
    shutil.rmtree(_TEST_DB_DIR, ignore_errors=True)


@pytest.fixture(autouse=True)
def reset_database():
    async def _reset():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    run_async(_reset())
    yield


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
