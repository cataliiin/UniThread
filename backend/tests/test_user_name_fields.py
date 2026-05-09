from __future__ import annotations

import asyncio

from app.database.models import University
from app.database.session import AsyncSessionLocal


def run_async(coro):
    return asyncio.run(coro)


def ensure_university() -> None:
    async def _create():
        async with AsyncSessionLocal() as session:
            session.add(University(name="UnitBV", domain="unitbv.ro"))
            await session.commit()

    run_async(_create())


def register_user(
    client,
    *,
    username: str,
    email: str,
    password: str,
    first_name: str | None = None,
    last_name: str | None = None,
):
    payload = {
        "username": username,
        "email": email,
        "password": password,
        "first_name": first_name,
        "last_name": last_name,
    }
    return client.post("/api/v1/auth/register", json=payload)


def login(client, *, username: str, password: str) -> None:
    client.cookies.clear()
    response = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password},
    )
    assert response.status_code == 200, response.text


def test_register_and_profile_reads_include_first_and_last_name(client):
    ensure_university()

    register_response = register_user(
        client,
        username="alice_admin",
        email="alice@unitbv.ro",
        password="Password123!",
        first_name="Alice",
        last_name="Admin",
    )
    assert register_response.status_code == 201, register_response.text
    payload = register_response.json()
    assert payload["first_name"] == "Alice"
    assert payload["last_name"] == "Admin"

    login(client, username="alice@unitbv.ro", password="Password123!")

    me_response = client.get("/api/v1/users/me")
    assert me_response.status_code == 200, me_response.text
    assert me_response.json()["first_name"] == "Alice"
    assert me_response.json()["last_name"] == "Admin"

    public_profile = client.get(f"/api/v1/users/{payload['id']}")
    assert public_profile.status_code == 200, public_profile.text
    assert public_profile.json()["first_name"] == "Alice"
    assert public_profile.json()["last_name"] == "Admin"


def test_profile_update_can_set_first_and_last_name_without_breaking_existing_registration_flow(
    client,
):
    ensure_university()

    register_response = register_user(
        client,
        username="bob_member",
        email="bob@unitbv.ro",
        password="Password123!",
    )
    assert register_response.status_code == 201, register_response.text
    payload = register_response.json()
    assert payload["first_name"] is None
    assert payload["last_name"] is None

    login(client, username="bob@unitbv.ro", password="Password123!")

    patch_response = client.patch(
        "/api/v1/users/me",
        json={
            "first_name": "Bob",
            "last_name": "Member",
            "avatar_key": "avatar-key-2",
        },
    )
    assert patch_response.status_code == 200, patch_response.text
    patched_payload = patch_response.json()
    assert patched_payload["first_name"] == "Bob"
    assert patched_payload["last_name"] == "Member"
    assert patched_payload["avatar_key"] == "avatar-key-2"

    me_response = client.get("/api/v1/users/me")
    assert me_response.status_code == 200, me_response.text
    assert me_response.json()["first_name"] == "Bob"
    assert me_response.json()["last_name"] == "Member"

    public_profile = client.get(f"/api/v1/users/{payload['id']}")
    assert public_profile.status_code == 200, public_profile.text
    assert public_profile.json()["first_name"] == "Bob"
    assert public_profile.json()["last_name"] == "Member"
