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

from app.core.security import get_password_hash
from app.database.models import Base, University, User
from app.database.session import AsyncSessionLocal, engine
from app.main import app

BACKEND_DIR = Path(__file__).resolve().parents[1]
TEST_DB_DIR = Path(tempfile.mkdtemp(prefix="unithread-pytest-"))
TEST_DB_PATH = TEST_DB_DIR / "unithread-test.sqlite3"

os.environ.setdefault("PROJECT_DESCRIPTION", "UniThread pytest regression tests")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def run_async(coro):
    return asyncio.run(coro)


async def _reset_database() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


async def _seed_user() -> dict[str, object]:
    async with AsyncSessionLocal() as session:
        university = University(
            name="Transilvania University of Brasov",
            domain="unitbv.ro",
        )
        session.add(university)
        await session.flush()

        password = "Password123!"
        user = User(
            email="alice@unitbv.ro",
            username="alice",
            password_hash=get_password_hash(password),
            university_id=university.id,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "password": password,
        }


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_database():
    yield
    run_async(engine.dispose())
    shutil.rmtree(TEST_DB_DIR, ignore_errors=True)


@pytest.fixture(autouse=True)
def reset_database():
    run_async(_reset_database())
    yield


@pytest.fixture
def client(monkeypatch):
    @asynccontextmanager
    async def noop_lifespan(_app):
        yield

    monkeypatch.setattr(app.router, "lifespan_context", noop_lifespan)

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def seeded_user() -> dict[str, object]:
    return run_async(_seed_user())
