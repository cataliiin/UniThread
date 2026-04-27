from __future__ import annotations

import os
import sys
import time
import tempfile
import shutil
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Any
from uuid import UUID

from fastapi.testclient import TestClient
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.table import Table

# --- Mandatory environment isolation (must happen before app imports) ---
_TEST_DB_DIR = Path(tempfile.mkdtemp(prefix="unithread-audit-"))
_TEST_DB_PATH = _TEST_DB_DIR / "test_audit.db"
os.environ["PROJECT_DESCRIPTION"] = "UniThread Full Backend Audit"
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ["JWT_SECRET_KEY"] = "audit-secret-key"
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("DEBUG", "false")
os.environ.setdefault("COOKIE_SECURE", "false")

# Add backend root to path
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
	sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
from app.database.models import (  # noqa: E402
	Base,
	Community,
	CommunityInvitation,
	CommunityInviteLink,
	CommunityJoinQuestion,
	CommunityMember,
	Post,
	University,
	User,
	Vote,
)
from app.database.models.enums import CommunityType, InvitationStatus, MemberStatus  # noqa: E402
from app.database.session import engine, AsyncSessionLocal  # noqa: E402


console = Console()


def run_async(coro):
	import asyncio

	return asyncio.run(coro)


async def reset_database() -> None:
	async with engine.begin() as conn:
		await conn.run_sync(Base.metadata.drop_all)
		await conn.run_sync(Base.metadata.create_all)


@asynccontextmanager
async def noop_lifespan(_app):
	yield


@dataclass
class TestResult:
	name: str
	status: str
	duration_s: float
	details: str = ""


class AuditContext:
	def __init__(self, client: TestClient):
		self.client = client
		self.users: dict[str, dict[str, Any]] = {}
		self.communities: dict[str, str] = {}
		self.posts: dict[str, str] = {}
		self.questions: dict[str, str] = {}
		self.invites: dict[str, str] = {}
		self.errors: list[str] = []

	def login(self, alias: str) -> None:
		user = self.users[alias]
		resp = self.client.post(
			"/api/v1/auth/login",
			data={"username": user["email"], "password": user["password"]},
		)
		assert resp.status_code == 200, resp.text


def assert_status(resp, expected: int, msg: str = ""):
	if resp.status_code != expected:
		raise AssertionError(
			f"{msg} expected={expected} got={resp.status_code} body={resp.text}"
		)


def create_user_via_register(client: TestClient, username: str, email: str, password: str) -> dict[str, Any]:
	resp = client.post(
		"/api/v1/auth/register",
		json={"username": username, "email": email, "password": password},
	)
	assert_status(resp, 201, "register")
	return {
		"id": resp.json()["id"],
		"username": username,
		"email": email,
		"password": password,
	}


def ensure_university(name: str, domain: str) -> UUID:
	async def _create():
		async with AsyncSessionLocal() as session:
			existing = await session.scalar(
				__import__("sqlalchemy").select(University).where(University.domain == domain)
			)
			if existing:
				return existing.id
			uni = University(name=name, domain=domain)
			session.add(uni)
			await session.commit()
			await session.refresh(uni)
			return uni.id

	return run_async(_create())


def seed_user_direct(email: str, username: str, password: str, university_id: UUID) -> dict[str, Any]:
	async def _create():
		async with AsyncSessionLocal() as session:
			user = User(
				email=email,
				username=username,
				password_hash=get_password_hash(password),
				university_id=university_id,
			)
			session.add(user)
			await session.commit()
			await session.refresh(user)
			return {
				"id": str(user.id),
				"username": user.username,
				"email": user.email,
				"password": password,
			}

	return run_async(_create())


def test_health(ctx: AuditContext):
	resp = ctx.client.get("/health")
	assert_status(resp, 200, "health")
	payload = resp.json()
	assert "status" in payload


def test_auth_and_users(ctx: AuditContext):
	# Universities must exist before register.
	ensure_university("UnitBV", "unitbv.ro")

	ctx.users["alice"] = create_user_via_register(
		ctx.client,
		username="alice_admin",
		email="alice@unitbv.ro",
		password="Password123!",
	)
	ctx.users["bob"] = create_user_via_register(
		ctx.client,
		username="bob_member",
		email="bob@unitbv.ro",
		password="Password123!",
	)

	ctx.login("alice")

	me_resp = ctx.client.get("/api/v1/users/me")
	assert_status(me_resp, 200, "users/me")
	assert me_resp.json()["email"] == ctx.users["alice"]["email"]

	patch_resp = ctx.client.patch(
		"/api/v1/users/me",
		json={"username": "alice_admin.updated", "avatar_key": "avatar-key-1"},
	)
	assert_status(patch_resp, 200, "users/me patch")
	assert patch_resp.json()["username"] == "alice_admin.updated"

	# Password change + re-login with new password.
	change_pwd = ctx.client.patch(
		"/api/v1/users/me/password",
		json={"old_password": "Password123!", "new_password": "NewPassword123!"},
	)
	assert_status(change_pwd, 204, "password change")
	ctx.users["alice"]["password"] = "NewPassword123!"

	relogin = ctx.client.post(
		"/api/v1/auth/login",
		data={"username": ctx.users["alice"]["email"], "password": ctx.users["alice"]["password"]},
	)
	assert_status(relogin, 200, "re-login with new password")
	assert "access_token" in relogin.json()

	# Public profile.
	user_id = ctx.users["bob"]["id"]
	profile = ctx.client.get(f"/api/v1/users/{user_id}")
	assert_status(profile, 200, "user profile")
	assert profile.json()["id"] == user_id


def test_universities(ctx: AuditContext):
	# List + bounds checks
	resp = ctx.client.get("/api/v1/universities?page=1&size=1000000")
	assert_status(resp, 200, "universities list")
	payload = resp.json()
	assert payload["size"] == 100
	assert payload["total"] >= 1

	invalid = ctx.client.get("/api/v1/universities?page=0")
	assert_status(invalid, 422, "universities page validation")

	first_uni = payload["items"][0]
	detail = ctx.client.get(f"/api/v1/universities/{first_uni['id']}")
	assert_status(detail, 200, "university detail")
	assert detail.json()["id"] == first_uni["id"]


def test_community_lifecycle_and_membership(ctx: AuditContext):
	ctx.login("alice")

	create_public = ctx.client.post(
		"/api/v1/communities",
		json={
			"name": "Public Community",
			"description": "public desc",
			"type": "public",
			"allow_anonymous": True,
			"icon_key": None,
			"banner_key": None,
		},
	)
	assert_status(create_public, 201, "create public community")
	public_id = create_public.json()["id"]
	ctx.communities["public"] = public_id

	create_request = ctx.client.post(
		"/api/v1/communities",
		json={
			"name": "Request Community",
			"description": "request desc",
			"type": "request",
			"allow_anonymous": False,
			"icon_key": None,
			"banner_key": None,
		},
	)
	assert_status(create_request, 201, "create request community")
	request_id = create_request.json()["id"]
	ctx.communities["request"] = request_id

	create_invite = ctx.client.post(
		"/api/v1/communities",
		json={
			"name": "Invite Community",
			"description": "invite desc",
			"type": "invite",
			"allow_anonymous": False,
			"icon_key": None,
			"banner_key": None,
		},
	)
	assert_status(create_invite, 201, "create invite community")
	invite_id = create_invite.json()["id"]
	ctx.communities["invite"] = invite_id

	# Community list + cap
	listed = ctx.client.get("/api/v1/communities?page=1&size=1000000")
	assert_status(listed, 200, "list communities")
	assert listed.json()["size"] == 100

	# Update community
	updated = ctx.client.patch(
		f"/api/v1/communities/{public_id}",
		json={"description": "public updated"},
	)
	assert_status(updated, 200, "update community")
	assert updated.json()["description"] == "public updated"

	# Add join question to request community
	q_create = ctx.client.post(
		f"/api/v1/communities/{request_id}/questions",
		json={"question": "Why do you want to join?", "is_required": True, "order_index": 0},
	)
	assert_status(q_create, 201, "create join question")
	question_id = q_create.json()["id"]
	ctx.questions["request_q1"] = question_id

	# Bob joins public directly
	ctx.login("bob")
	join_public = ctx.client.post(f"/api/v1/communities/{public_id}/join", json={})
	assert_status(join_public, 200, "join public")
	assert join_public.json()["status"] == "approved"

	# Double join should conflict
	join_public_again = ctx.client.post(f"/api/v1/communities/{public_id}/join", json={})
	assert_status(join_public_again, 409, "double join public")

	# Bob request-join (pending)
	join_request = ctx.client.post(
		f"/api/v1/communities/{request_id}/join",
		json={"answers": [{"question_id": question_id, "answer": "I like this topic"}]},
	)
	assert_status(join_request, 200, "request join")
	assert join_request.json()["status"] == "pending"

	# Join with foreign question id must fail
	invalid_join = ctx.client.post(
		f"/api/v1/communities/{request_id}/join",
		json={"answers": [{"question_id": str(UUID(int=0)), "answer": "x"}]},
	)
	assert_status(invalid_join, 409, "invalid join question id after pending")

	# Invite community cannot be joined directly
	join_invite_direct = ctx.client.post(f"/api/v1/communities/{invite_id}/join", json={})
	assert_status(join_invite_direct, 403, "join invite directly")

	# Bob cannot list members for request community while pending
	list_members_pending = ctx.client.get(f"/api/v1/communities/{request_id}/members")
	assert_status(list_members_pending, 403, "members visibility for pending user")

	# Alice approves Bob request
	ctx.login("alice")
	list_requests = ctx.client.get(f"/api/v1/communities/{request_id}/requests")
	assert_status(list_requests, 200, "list join requests")
	assert len(list_requests.json()) >= 1

	approve = ctx.client.post(
		f"/api/v1/communities/{request_id}/requests/{ctx.users['bob']['id']}/approve"
	)
	assert_status(approve, 200, "approve join request")
	assert approve.json()["status"] == "approved"

	# Invite link flow
	link_create = ctx.client.post(
		f"/api/v1/communities/{invite_id}/invite-links",
		json={"max_uses": 5},
	)
	assert_status(link_create, 201, "create invite link")
	code = link_create.json()["code"]
	ctx.invites["invite_code"] = code

	# Bob uses invite link
	ctx.login("bob")
	preview = ctx.client.get(f"/api/v1/invite/{code}")
	assert_status(preview, 200, "preview invite link")
	assert preview.json()["community"]["id"] == invite_id

	join_by_link = ctx.client.post(f"/api/v1/invite/{code}")
	assert_status(join_by_link, 200, "join by invite link")
	assert join_by_link.json()["status"] == "approved"

	# Owner cannot leave
	ctx.login("alice")
	owner_leave = ctx.client.post(f"/api/v1/communities/{public_id}/leave")
	assert_status(owner_leave, 403, "owner cannot leave")

	# Transfer ownership to Bob (approved member)
	transfer = ctx.client.post(
		f"/api/v1/communities/{public_id}/transfer-ownership",
		json={"new_owner_id": ctx.users["bob"]["id"]},
	)
	assert_status(transfer, 200, "transfer ownership")
	assert transfer.json()["owner_id"] == ctx.users["bob"]["id"]

	# Now Alice can leave
	leave_after_transfer = ctx.client.post(f"/api/v1/communities/{public_id}/leave")
	assert_status(leave_after_transfer, 204, "leave after transfer")


def test_admin_management(ctx: AuditContext):
	request_id = ctx.communities["request"]

	# Bob should now be approved member in request community.
	ctx.login("alice")

	promote = ctx.client.patch(
		f"/api/v1/communities/{request_id}/members/{ctx.users['bob']['id']}/role",
		json={"is_admin": True},
	)
	assert_status(promote, 200, "promote admin")
	assert promote.json()["is_admin"] is True

	admins = ctx.client.get(f"/api/v1/communities/{request_id}/admins")
	assert_status(admins, 200, "list admins")
	admin_ids = {entry["id"] for entry in admins.json()}
	assert ctx.users["alice"]["id"] in admin_ids
	assert ctx.users["bob"]["id"] in admin_ids

	members = ctx.client.get(f"/api/v1/communities/{request_id}/members?page=1&size=1000000")
	assert_status(members, 200, "list members")
	assert members.json()["size"] == 100
	assert members.json()["total"] >= 2

	demote = ctx.client.patch(
		f"/api/v1/communities/{request_id}/members/{ctx.users['bob']['id']}/role",
		json={"is_admin": False},
	)
	assert_status(demote, 200, "demote admin")
	assert demote.json()["is_admin"] is False


def test_posts_and_votes(ctx: AuditContext):
	public_id = ctx.communities["public"]

	# Bob is owner after transfer, and member in public community.
	ctx.login("bob")

	post_normal = ctx.client.post(
		"/api/v1/posts",
		json={
			"title": "Normal Post",
			"body": "Normal body",
			"community_id": public_id,
			"is_anonymous": False,
		},
	)
	assert_status(post_normal, 201, "create normal post")
	post_normal_id = post_normal.json()["id"]
	ctx.posts["normal"] = post_normal_id

	post_anon = ctx.client.post(
		"/api/v1/posts",
		json={
			"title": "Anon Post",
			"body": "Anon body",
			"community_id": public_id,
			"is_anonymous": True,
		},
	)
	assert_status(post_anon, 201, "create anonymous post")
	anon_id = post_anon.json()["id"]
	ctx.posts["anon"] = anon_id

	# Feed checks
	global_feed = ctx.client.get("/api/v1/posts?page=1&size=1000000")
	assert_status(global_feed, 200, "global feed")
	assert global_feed.json()["size"] == 100

	community_feed = ctx.client.get(f"/api/v1/communities/{public_id}/posts?page=1&size=1000000")
	assert_status(community_feed, 200, "community feed")
	assert community_feed.json()["size"] == 100

	# Deep link and anonymous author integrity
	get_anon = ctx.client.get(f"/api/v1/posts/{anon_id}")
	assert_status(get_anon, 200, "get anonymous post")
	anon_payload = get_anon.json()
	assert anon_payload["is_anonymous"] is True
	assert anon_payload["author"] is None
	assert anon_payload["author_id"] is None

	# Update/delete by author
	upd = ctx.client.patch(f"/api/v1/posts/{post_normal_id}", json={"title": "Updated Post"})
	assert_status(upd, 200, "update post")
	assert upd.json()["title"] == "Updated Post"

	# Vote lifecycle +1 -> -1 -> 0 (withdraw)
	vote_up = ctx.client.post(f"/api/v1/posts/{post_normal_id}/vote", json={"value": 1})
	assert_status(vote_up, 200, "vote +1")
	assert vote_up.json()["score"] >= 1
	assert vote_up.json()["user_vote"] == 1

	vote_down = ctx.client.post(f"/api/v1/posts/{post_normal_id}/vote", json={"value": -1})
	assert_status(vote_down, 200, "vote -1")
	assert vote_down.json()["user_vote"] == -1

	vote_clear = ctx.client.post(f"/api/v1/posts/{post_normal_id}/vote", json={"value": 0})
	assert_status(vote_clear, 200, "withdraw vote")
	assert vote_clear.json()["user_vote"] is None

	delete_post = ctx.client.delete(f"/api/v1/posts/{post_normal_id}")
	assert_status(delete_post, 204, "delete post")


def test_search(ctx: AuditContext):
	ctx.login("bob")

	# Seed one post for search if needed
	public_id = ctx.communities["public"]
	seed = ctx.client.post(
		"/api/v1/posts",
		json={
			"title": "Searchable content",
			"body": "Distributed systems and campus life",
			"community_id": public_id,
			"is_anonymous": False,
		},
	)
	assert_status(seed, 201, "seed searchable post")

	# global search
	res_all = ctx.client.get("/api/v1/search?q=searchable&type=posts&limit=50")
	assert_status(res_all, 200, "search posts")
	assert len(res_all.json()["posts"]) >= 1

	res_users = ctx.client.get("/api/v1/search?q=bob&type=users&limit=10")
	assert_status(res_users, 200, "search users")
	assert any(u["username"].startswith("bob") for u in res_users.json()["users"])

	res_comms = ctx.client.get("/api/v1/search?q=community&type=communities&limit=10")
	assert_status(res_comms, 200, "search communities")
	assert len(res_comms.json()["communities"]) >= 1


def test_openapi_omissions(ctx: AuditContext):
	"""
	Covers OpenAPI-listed capabilities that are easy to omit:
	- Invite direct acceptance/decline endpoints
	- Questions update/delete
	- Join request rejection
	- Invite links list/delete
	- Community delete (owner)
	"""
	request_id = ctx.communities["request"]
	invite_id = ctx.communities["invite"]

	# Create temporary user charlie for invitation accept/decline + join reject flow
	ctx.users["charlie"] = create_user_via_register(
		ctx.client,
		username="charlie_temp",
		email="charlie@unitbv.ro",
		password="Password123!",
	)

	ctx.login("alice")

	# Update + delete question
	question_id = ctx.questions["request_q1"]
	q_update = ctx.client.patch(
		f"/api/v1/communities/{request_id}/questions/{question_id}",
		json={"question": "Updated join question", "is_required": True, "order_index": 1},
	)
	assert_status(q_update, 200, "update question")
	assert q_update.json()["question"] == "Updated join question"

	# Add another question to delete
	q2 = ctx.client.post(
		f"/api/v1/communities/{request_id}/questions",
		json={"question": "Delete me question", "is_required": False, "order_index": 2},
	)
	assert_status(q2, 201, "create second question")
	q2_id = q2.json()["id"]
	q2_delete = ctx.client.delete(f"/api/v1/communities/{request_id}/questions/{q2_id}")
	assert_status(q2_delete, 204, "delete question")

	# Invite links list + delete
	links = ctx.client.get(f"/api/v1/communities/{invite_id}/invite-links")
	assert_status(links, 200, "list invite links")
	assert len(links.json()) >= 1
	link_id = links.json()[0]["id"]
	link_delete = ctx.client.delete(f"/api/v1/communities/{invite_id}/invite-links/{link_id}")
	assert_status(link_delete, 204, "delete invite link")

	# Direct invitation accept + decline
	invite_create = ctx.client.post(
		f"/api/v1/communities/{invite_id}/invitations",
		json={"invited_user": ctx.users["charlie"]["id"]},
	)
	assert_status(invite_create, 201, "create direct invitation")
	invite_obj_id = invite_create.json()["id"]

	ctx.login("charlie")
	my_inv = ctx.client.get("/api/v1/me/invitations")
	assert_status(my_inv, 200, "list my invitations")
	assert any(i["id"] == invite_obj_id for i in my_inv.json())

	accept = ctx.client.post(f"/api/v1/me/invitations/{invite_obj_id}/accept")
	assert_status(accept, 200, "accept direct invitation")
	assert accept.json()["status"] == "approved"

	# Create a second invitation then decline
	ctx.login("alice")
	invite_create2 = ctx.client.post(
		f"/api/v1/communities/{request_id}/invitations",
		json={"invited_user": ctx.users["charlie"]["id"]},
	)
	# Could be 409 if charlie already approved member in request community; if so, create ephemeral user.
	if invite_create2.status_code == 409:
		ctx.users["dana"] = create_user_via_register(
			ctx.client,
			username="dana_temp",
			email="dana@unitbv.ro",
			password="Password123!",
		)
		invite_create2 = ctx.client.post(
			f"/api/v1/communities/{request_id}/invitations",
			json={"invited_user": ctx.users["dana"]["id"]},
		)
		assert_status(invite_create2, 201, "create second direct invitation")
		target_alias = "dana"
	else:
		assert_status(invite_create2, 201, "create second direct invitation")
		target_alias = "charlie"

	inv2 = invite_create2.json()["id"]
	ctx.login(target_alias)
	decline = ctx.client.post(f"/api/v1/me/invitations/{inv2}/decline")
	assert_status(decline, 204, "decline invitation")

	# Join request reject flow
	ctx.login(target_alias)
	join_req = ctx.client.post(
		f"/api/v1/communities/{request_id}/join",
		json={"answers": [{"question_id": question_id, "answer": "please approve me"}]},
	)
	# if already member due to previous flows, use another user
	if join_req.status_code in (200, 409):
		if join_req.status_code == 409:
			ctx.login("alice")
			ctx.users["erin"] = create_user_via_register(
				ctx.client,
				username="erin_temp",
				email="erin@unitbv.ro",
				password="Password123!",
			)
			ctx.login("erin")
			join_req = ctx.client.post(
				f"/api/v1/communities/{request_id}/join",
				json={"answers": [{"question_id": question_id, "answer": "please approve me"}]},
			)
			assert_status(join_req, 200, "create pending join request")
			reject_target = ctx.users["erin"]["id"]
		else:
			reject_target = ctx.users[target_alias]["id"]
	else:
		assert_status(join_req, 200, "create pending join request")
		reject_target = ctx.users[target_alias]["id"]

	ctx.login("alice")
	reject = ctx.client.post(
		f"/api/v1/communities/{request_id}/requests/{reject_target}/reject"
	)
	assert_status(reject, 204, "reject join request")

	# Final: community delete owner-only
	delete_target = ctx.communities["invite"]
	delete_resp = ctx.client.delete(f"/api/v1/communities/{delete_target}")
	assert_status(delete_resp, 204, "delete community owner")


def run_suite() -> list[TestResult]:
	tests: list[tuple[str, Callable[[AuditContext], None]]] = [
		("Health", test_health),
		("Auth + Users", test_auth_and_users),
		("Universities", test_universities),
		("Community Lifecycle + Membership", test_community_lifecycle_and_membership),
		("Admin Management", test_admin_management),
		("Posts + Votes", test_posts_and_votes),
		("Search", test_search),
		("OpenAPI Omission Coverage", test_openapi_omissions),
	]

	# Disable startup health worker during tests
	app.router.lifespan_context = noop_lifespan

	results: list[TestResult] = []
	with TestClient(app) as client:
		ctx = AuditContext(client)

		with Progress(
			SpinnerColumn(),
			TextColumn("[bold cyan]{task.description}"),
			BarColumn(),
			TextColumn("{task.completed}/{task.total}"),
			TimeElapsedColumn(),
			console=console,
			transient=True,
		) as progress:
			task_id = progress.add_task("Running Full Integration Audit", total=len(tests))

			for name, fn in tests:
				t0 = time.perf_counter()
				try:
					fn(ctx)
					dt = time.perf_counter() - t0
					results.append(TestResult(name=name, status="PASS", duration_s=dt))
				except Exception as exc:  # noqa: BLE001
					dt = time.perf_counter() - t0
					results.append(
						TestResult(
							name=name,
							status="FAIL",
							duration_s=dt,
							details=str(exc),
						)
					)
				progress.advance(task_id)

	return results


def render_report(results: list[TestResult], total_time: float):
	passed = sum(1 for r in results if r.status == "PASS")
	failed = sum(1 for r in results if r.status == "FAIL")

	summary = Table(title="UniThread Full Audit Summary", show_lines=True)
	summary.add_column("Test", style="cyan")
	summary.add_column("Status", justify="center")
	summary.add_column("Duration (s)", justify="right")
	summary.add_column("Details", style="dim")

	for r in results:
		status_cell = "[green]PASS[/green]" if r.status == "PASS" else "[red]FAIL[/red]"
		summary.add_row(r.name, status_cell, f"{r.duration_s:.3f}", r.details)

	totals = Table(show_header=False)
	totals.add_column("Metric", style="bold")
	totals.add_column("Value")
	totals.add_row("Passed", f"[green]{passed}[/green]")
	totals.add_row("Failed", f"[red]{failed}[/red]")
	totals.add_row("Total", str(len(results)))
	totals.add_row("Total Time (s)", f"{total_time:.3f}")
	totals.add_row("SQLite DB", str(_TEST_DB_PATH))

	panel_style = "green" if failed == 0 else "red"
	panel_title = "FULL AUDIT PASSED" if failed == 0 else "FULL AUDIT FAILED"

	console.print(summary)
	console.print(
		Panel.fit(
			totals,
			title=panel_title,
			border_style=panel_style,
		)
	)


def cleanup():
	try:
		run_async(engine.dispose())
	finally:
		shutil.rmtree(_TEST_DB_DIR, ignore_errors=True)


def main() -> int:
	console.print(
		Panel.fit(
			"[bold]UniThread Mega Integration Audit[/bold]\n"
			"- SQLite temporary isolation enabled\n"
			"- Rich output + progress + summary\n"
			"- OpenAPI-driven endpoint coverage",
			title="Audit Runner",
			border_style="cyan",
		)
	)

	start = time.perf_counter()
	try:
		run_async(reset_database())
		results = run_suite()
		total_time = time.perf_counter() - start
		render_report(results, total_time)
		failed = any(r.status == "FAIL" for r in results)
		return 1 if failed else 0
	finally:
		cleanup()


if __name__ == "__main__":
	raise SystemExit(main())
