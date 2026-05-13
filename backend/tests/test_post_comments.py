from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass

from app.core.security import get_password_hash
from app.database.models import Community, CommunityMember, Post, University, User
from app.database.models.enums import CommunityType, MemberStatus
from app.database.session import AsyncSessionLocal


@dataclass
class UserCredentials:
    id: str
    email: str
    password: str


@dataclass
class CommentScenario:
    owner: UserCredentials
    member: UserCredentials
    outsider: UserCredentials
    public_community_id: str
    private_community_id: str
    public_post_id: str
    private_post_id: str


def run_async(coro):
    return asyncio.run(coro)


def login(client, user: UserCredentials) -> None:
    client.cookies.clear()
    response = client.post(
        "/api/v1/auth/login",
        data={"username": user.email, "password": user.password},
    )
    assert response.status_code == 200, response.text


def find_post(payload: dict, post_id: str) -> dict:
    for item in payload["items"]:
        if item["id"] == post_id:
            return item
    raise AssertionError(f"Post {post_id} not found in response: {payload}")


def seed_comment_scenario() -> CommentScenario:
    async def _seed():
        async with AsyncSessionLocal() as session:
            university = University(name="UnitBV", domain="unitbv.ro")
            session.add(university)
            await session.flush()

            owner = User(
                email="owner@unitbv.ro",
                username="owner_user",
                password_hash=get_password_hash("Password123!"),
                university_id=university.id,
            )
            member = User(
                email="member@unitbv.ro",
                username="member_user",
                password_hash=get_password_hash("Password123!"),
                university_id=university.id,
            )
            outsider = User(
                email="outsider@unitbv.ro",
                username="outsider_user",
                password_hash=get_password_hash("Password123!"),
                university_id=university.id,
            )
            session.add_all([owner, member, outsider])
            await session.flush()

            public_community = Community(
                name="Open Campus",
                description="Public campus discussions",
                type=CommunityType.public,
                allow_anonymous=False,
                university_id=university.id,
                owner_id=owner.id,
            )
            private_community = Community(
                name="Research Lab",
                description="Request-only research discussions",
                type=CommunityType.request,
                allow_anonymous=False,
                university_id=university.id,
                owner_id=owner.id,
            )
            session.add_all([public_community, private_community])
            await session.flush()

            session.add_all(
                [
                    CommunityMember(
                        user_id=owner.id,
                        community_id=public_community.id,
                        status=MemberStatus.approved,
                        is_admin=True,
                    ),
                    CommunityMember(
                        user_id=owner.id,
                        community_id=private_community.id,
                        status=MemberStatus.approved,
                        is_admin=True,
                    ),
                    CommunityMember(
                        user_id=member.id,
                        community_id=public_community.id,
                        status=MemberStatus.approved,
                        is_admin=False,
                    ),
                ]
            )

            public_post = Post(
                title="Campus announcement",
                body="Welcome to UniThread.",
                community_id=public_community.id,
                author_id=owner.id,
                is_anonymous=False,
            )
            private_post = Post(
                title="Lab roadmap",
                body="Semester planning details.",
                community_id=private_community.id,
                author_id=owner.id,
                is_anonymous=False,
            )
            session.add_all([public_post, private_post])
            await session.commit()

            return CommentScenario(
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
                outsider=UserCredentials(
                    id=str(outsider.id),
                    email=outsider.email,
                    password="Password123!",
                ),
                public_community_id=str(public_community.id),
                private_community_id=str(private_community.id),
                public_post_id=str(public_post.id),
                private_post_id=str(private_post.id),
            )

    return run_async(_seed())


def test_create_and_list_comments_and_counts(client):
    scenario = seed_comment_scenario()

    login(client, scenario.member)

    first_comment = client.post(
        f"/api/v1/posts/{scenario.public_post_id}/comments",
        json={"body": "First comment"},
    )
    assert first_comment.status_code == 201, first_comment.text
    assert first_comment.json()["author"]["username"] == "member_user"

    time.sleep(0.01)

    second_comment = client.post(
        f"/api/v1/posts/{scenario.public_post_id}/comments",
        json={"body": "Second comment"},
    )
    assert second_comment.status_code == 201, second_comment.text

    comments_response = client.get(f"/api/v1/posts/{scenario.public_post_id}/comments")
    assert comments_response.status_code == 200, comments_response.text
    assert [item["body"] for item in comments_response.json()] == [
        "First comment",
        "Second comment",
    ]

    login(client, scenario.outsider)

    visible_comments = client.get(f"/api/v1/posts/{scenario.public_post_id}/comments")
    assert visible_comments.status_code == 200, visible_comments.text
    assert len(visible_comments.json()) == 2

    blocked_write = client.post(
        f"/api/v1/posts/{scenario.public_post_id}/comments",
        json={"body": "I should not be able to comment"},
    )
    assert blocked_write.status_code == 403, blocked_write.text

    global_feed = client.get("/api/v1/posts")
    assert global_feed.status_code == 200, global_feed.text
    assert find_post(global_feed.json(), scenario.public_post_id)["comment_count"] == 2

    community_feed = client.get(
        f"/api/v1/communities/{scenario.public_community_id}/posts"
    )
    assert community_feed.status_code == 200, community_feed.text
    assert find_post(community_feed.json(), scenario.public_post_id)["comment_count"] == 2

    post_detail = client.get(f"/api/v1/posts/{scenario.public_post_id}")
    assert post_detail.status_code == 200, post_detail.text
    assert post_detail.json()["comment_count"] == 2


def test_comment_delete_by_author_and_admin_updates_counts(client):
    scenario = seed_comment_scenario()

    login(client, scenario.member)
    first_comment = client.post(
        f"/api/v1/posts/{scenario.public_post_id}/comments",
        json={"body": "Author delete me"},
    )
    assert first_comment.status_code == 201, first_comment.text

    second_comment = client.post(
        f"/api/v1/posts/{scenario.public_post_id}/comments",
        json={"body": "Admin delete me"},
    )
    assert second_comment.status_code == 201, second_comment.text

    delete_as_author = client.delete(
        f"/api/v1/posts/{scenario.public_post_id}/comments/{first_comment.json()['id']}"
    )
    assert delete_as_author.status_code == 204, delete_as_author.text

    post_detail_after_author_delete = client.get(f"/api/v1/posts/{scenario.public_post_id}")
    assert post_detail_after_author_delete.status_code == 200
    assert post_detail_after_author_delete.json()["comment_count"] == 1

    login(client, scenario.owner)
    delete_as_admin = client.delete(
        f"/api/v1/posts/{scenario.public_post_id}/comments/{second_comment.json()['id']}"
    )
    assert delete_as_admin.status_code == 204, delete_as_admin.text

    comments_response = client.get(f"/api/v1/posts/{scenario.public_post_id}/comments")
    assert comments_response.status_code == 200, comments_response.text
    assert comments_response.json() == []

    post_detail_after_admin_delete = client.get(f"/api/v1/posts/{scenario.public_post_id}")
    assert post_detail_after_admin_delete.status_code == 200
    assert post_detail_after_admin_delete.json()["comment_count"] == 0


def test_comment_endpoints_forbidden_on_non_visible_private_post(client):
    scenario = seed_comment_scenario()

    login(client, scenario.outsider)

    list_response = client.get(f"/api/v1/posts/{scenario.private_post_id}/comments")
    assert list_response.status_code == 403, list_response.text

    create_response = client.post(
        f"/api/v1/posts/{scenario.private_post_id}/comments",
        json={"body": "I should not see this post"},
    )
    assert create_response.status_code == 403, create_response.text


def test_comment_endpoints_return_404_for_missing_posts(client):
    scenario = seed_comment_scenario()
    missing_post_id = str(uuid.uuid4())

    login(client, scenario.owner)

    list_response = client.get(f"/api/v1/posts/{missing_post_id}/comments")
    assert list_response.status_code == 404, list_response.text

    create_response = client.post(
        f"/api/v1/posts/{missing_post_id}/comments",
        json={"body": "Missing post"},
    )
    assert create_response.status_code == 404, create_response.text
