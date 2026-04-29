from fastapi import APIRouter

from app.routes import (
    auth,
    communities,
    community_admin,
    invitations,
    posts,
    search,
    storage,
    universities,
    users,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(universities.router)
api_router.include_router(communities.router)
api_router.include_router(community_admin.router)
api_router.include_router(invitations.router)
api_router.include_router(posts.router)
api_router.include_router(search.router)
api_router.include_router(storage.router)
