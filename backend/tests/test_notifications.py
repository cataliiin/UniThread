from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass

from app.core.security import get_password_hash
from app.database.models import Community, CommunityMember, Post, University, User
from app.database.models.enums import CommunityType, MemberStatus, NotificationType
from app.database.models.notification import Notification
from app.database.session import AsyncSessionLocal


@dataclass
class UserCredentials:
    id: str
    email: str
    password: str


@dataclass
class NotificationScenario:
    owner: UserCredentials
    member: UserCredentials
    community_id: str


def run_async(coro):
    return asyncio.run(coro)


def login(client, user: UserCredentials) -> None:
    client.cookies.clear()
    response = client.post(
        "/api/v1/auth/login",
        data={"username": user.email, "password": user.password},
    )
    assert response.status_code == 200, response.text


def seed_notification_scenario() -> NotificationScenario:
    async def _seed():
        async with AsyncSessionLocal() as session:
            # Clean notifications and database tables related to this test
            university = University(name="UnitBV", domain="unitbv.ro")
            session.add(university)
            await session.flush()

            owner = User(
                email="notif_owner@unitbv.ro",
                username="notif_owner",
                password_hash=get_password_hash("Password123!"),
                university_id=university.id,
            )
            member = User(
                email="notif_member@unitbv.ro",
                username="notif_member",
                password_hash=get_password_hash("Password123!"),
                university_id=university.id,
            )
            session.add_all([owner, member])
            await session.flush()

            community = Community(
                name="Notification Club",
                description="Club for notifications",
                type=CommunityType.public,
                allow_anonymous=True,
                university_id=university.id,
                owner_id=owner.id,
            )
            session.add(community)
            await session.flush()

            session.add_all(
                [
                    CommunityMember(
                        user_id=owner.id,
                        community_id=community.id,
                        status=MemberStatus.approved,
                        is_admin=True,
                    ),
                    CommunityMember(
                        user_id=member.id,
                        community_id=community.id,
                        status=MemberStatus.approved,
                        is_admin=False,
                    ),
                ]
            )
            await session.commit()

            return NotificationScenario(
                owner=UserCredentials(
                    id=str(owner.id),
                    email=owner.email,
                    password="Password123!",
                ),
                member=UserCredentials(
                    id=str(member.id),
                    email=member.email,
                    password="Password123!",
                ),
                community_id=str(community.id),
            )

    return run_async(_seed())


def test_notification_creation_and_api(client):
    scenario = seed_notification_scenario()

    # 1. Login as owner and create a post
    login(client, scenario.owner)

    post_resp = client.post(
        "/api/v1/posts",
        json={
            "title": "Welcome Post",
            "body": "Welcome all members!",
            "community_id": scenario.community_id,
            "is_anonymous": False,
        },
    )
    assert post_resp.status_code == 201, post_resp.text
    post_id = post_resp.json()["id"]

    # 2. Login as member and check notifications
    login(client, scenario.member)

    notifs_resp = client.get("/api/v1/notifications")
    assert notifs_resp.status_code == 200, notifs_resp.text
    notifs = notifs_resp.json()
    assert len(notifs) >= 1

    notif = notifs[0]
    assert notif["type"] == "post"
    assert notif["post_id"] == post_id
    assert notif["read"] is False

    notif_id = notif["id"]

    # 3. Mark notification as read
    read_resp = client.patch(f"/api/v1/notifications/{notif_id}/read", json={})
    assert read_resp.status_code == 200, read_resp.text
    assert read_resp.json()["read"] is True

    # 4. Mark all as read
    read_all_resp = client.post("/api/v1/notifications/read-all", json={})
    assert read_all_resp.status_code == 204, read_all_resp.text

    # 5. Delete notification
    del_resp = client.delete(f"/api/v1/notifications/{notif_id}")
    assert del_resp.status_code == 204, del_resp.text

    # Check notification list is now empty
    notifs_resp_final = client.get("/api/v1/notifications")
    assert notifs_resp_final.status_code == 200
    assert not any(n["id"] == notif_id for n in notifs_resp_final.json())
