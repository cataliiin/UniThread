# UniThread

UniThread is a student community platform with a FastAPI backend and a SvelteKit frontend. The backend already contains most of the domain logic for universities, communities, invitations, posts, and search. The frontend is still at the starter-template stage.

## Current State

- Backend status: substantial API implementation exists under `/api/v1`.
- Frontend status: SvelteKit starter page is still in place in [`frontend/src/routes/+page.svelte`](/Users/eduard/Desktop/UniThread/UniThread/frontend/src/routes/+page.svelte:1).
- Infrastructure status: [`docker-compose.yml`](/Users/eduard/Desktop/UniThread/UniThread/docker-compose.yml:1) is empty.
- Documentation status: [`docs/DATABASE_SCHEMA.md`](/Users/eduard/Desktop/UniThread/UniThread/docs/DATABASE_SCHEMA.md:1) is the only filled-in doc; the other docs are placeholders.

## Repository Layout

- [`backend/`](/Users/eduard/Desktop/UniThread/UniThread/backend): FastAPI app, SQLAlchemy models, schemas, routes, and development utilities.
- [`frontend/`](/Users/eduard/Desktop/UniThread/UniThread/frontend): SvelteKit app with Vite tooling.
- [`docs/`](/Users/eduard/Desktop/UniThread/UniThread/docs): architecture, API, and schema notes.

## Backend Surface

The backend is mounted from [`backend/app/main.py`](/Users/eduard/Desktop/UniThread/UniThread/backend/app/main.py:1) and exposes:

- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET/PATCH /api/v1/users/me`
- `PATCH /api/v1/users/me/password`
- `GET /api/v1/users/{user_id}`
- `GET /api/v1/universities`
- `GET /api/v1/universities/{university_id}`
- `POST/GET/PATCH/DELETE /api/v1/communities`
- community join, leave, feed, join-question, join-request, invite-link, and direct-invitation flows
- invite-link preview and join flows
- `GET/POST/PATCH/DELETE /api/v1/posts` plus voting
- `GET /api/v1/search`
- `POST /api/v1/storage/presigned-url`

Main backend domains already modeled in SQLAlchemy:

- universities
- users
- communities and community members
- join questions and answers
- invite links and direct invitations
- posts and votes

## Frontend State

The frontend toolchain is wired correctly, but the app itself is not implemented yet:

- [`frontend/src/routes/+page.svelte`](/Users/eduard/Desktop/UniThread/UniThread/frontend/src/routes/+page.svelte:1) still renders the default SvelteKit welcome page.
- Route-level styling exists in [`frontend/src/routes/layout.css`](/Users/eduard/Desktop/UniThread/UniThread/frontend/src/routes/layout.css:1).
- No backend integration is present yet in the shipped UI.

## Local Setup

### Requirements

- Python 3.11+
- Node.js and npm
- A database URL
- A JWT secret
- MinIO if you want storage uploads to work

The backend config lives in [`backend/app/core/config.py`](/Users/eduard/Desktop/UniThread/UniThread/backend/app/core/config.py:1). The repo currently does not include an `.env.example`.

Required backend settings:

- `PROJECT_DESCRIPTION`
- `DATABASE_URL`
- `JWT_SECRET_KEY`

Common optional settings:

- `DEBUG`
- `BACKEND_CORS_ORIGINS`
- `JWT_ALGORITHM`
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`
- `MINIO_ENDPOINT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_SECURE`
- `HEALTH_CHECK_INTERVAL`

### Run The Backend

From the repo root:

```bash
python3.11 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
PROJECT_DESCRIPTION="UniThread local" \
DATABASE_URL="sqlite:///./local.sqlite3" \
JWT_SECRET_KEY="change-me" \
PYTHONPATH=backend \
.venv/bin/uvicorn app.main:app --reload
```

Notes:

- SQLite is supported by the session layer in [`backend/app/database/session.py`](/Users/eduard/Desktop/UniThread/UniThread/backend/app/database/session.py:1).
- MinIO is contacted during startup by [`backend/app/core/storage.py`](/Users/eduard/Desktop/UniThread/UniThread/backend/app/core/storage.py:1).
- [`backend/dev-utils.py`](/Users/eduard/Desktop/UniThread/UniThread/backend/dev-utils.py:1) contains helper commands for DB and storage setup/reset.

### Run The Frontend

```bash
cd frontend
npm ci
npm run dev
```

The default frontend dev server runs on `http://localhost:5173`, which matches the backend CORS defaults.

## Verified On 2026-04-26

The repo was inspected and exercised locally in its current state.

- `npm run check`: passed
- `npm run build`: passed
- `npm run lint`: failed because Prettier checks generated `.svelte-kit/*` files and `src/routes/layout.css`
- Backend functional pass: core routes were exercised against SQLite with seeded test data
- Health endpoint returned `degraded` because the database was up and MinIO was down

The detailed report is stored in [`tests.txt`](/Users/eduard/Desktop/UniThread/UniThread/tests.txt:1).

## Known Issues

- `docker-compose.yml` is currently empty, so the local stack is not containerized yet.
- The frontend is not integrated with the backend yet.
- `npm run lint` fails because Prettier checks generated `.svelte-kit/*` files and `src/routes/layout.css`.
