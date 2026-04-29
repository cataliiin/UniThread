# UniThread Backend Documentation

## 1. Scop si rezumat
Backend-ul UniThread este o aplicatie FastAPI care expune un API REST pentru o platforma multi-tenant (izolare pe universitate) cu comunitati, postari, invitatii si storage de fisiere prin MinIO. Codul este async-first (SQLAlchemy async + FastAPI) si foloseste Pydantic v2 pentru validari si schema response.

## 2. Stack tehnologic
- Runtime: Python 3.x
- Web: FastAPI 0.136.x + Uvicorn
- ORM/DB: SQLAlchemy 2.x (async)
- DB: PostgreSQL 15+ (prod), SQLite (dev/test)
- Auth: JWT (python-jose), cookie HttpOnly
- Hash parole: passlib (argon2/bcrypt)
- Storage: MinIO S3-compatible + presigned URLs
- Config: pydantic-settings (.env)

Dependinte principale: vezi `backend/requirements.txt` pentru versiuni exacte.

## 3. Structura proiectului (backend)
- `backend/app/main.py` – instantiere FastAPI, middleware CORS, health check, exception handlers.
- `backend/app/core/` – configurare, dependinte, securitate, storage, health.
- `backend/app/database/` – session async + modele SQLAlchemy.
- `backend/app/routes/` – rutele REST pe module (auth, users, communities, posts etc.).
- `backend/app/schemas/` – schema request/response Pydantic.
- `backend/tests/run_full_audit.py` – test integrat al fluxurilor principale.
- `backend/dev-utils.py` – CLI pentru DB + storage (Typer).

## 4. Configurare si variabile de mediu
Configurarea este in `backend/app/core/config.py` si citeste din `.env` (case sensitive).

Variabilele esentiale:
- `PROJECT_NAME` (default: UniThread)
- `PROJECT_DESCRIPTION` (obligatoriu)
- `DEBUG` (default: false) – controleaza SQL echo si alte loguri
- `BACKEND_CORS_ORIGINS` (default: ["http://localhost:5173", "http://localhost:3000"]) – lista origini
- `DATABASE_URL` (obligatoriu) – PostgreSQL sau SQLite
- `JWT_SECRET_KEY` (obligatoriu)
- `JWT_ALGORITHM` (default: HS256)
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` (default: 30)
- `COOKIE_SECURE` (default: false)
- `MINIO_ENDPOINT` (default: localhost:9000)
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` (default: minioadmin)
- `MINIO_SECURE` (default: false)
- `HEALTH_CHECK_INTERVAL` (default: 60 sec)

Notite:
- `DATABASE_URL` este rescris automat cu driver async (ex: `postgresql+asyncpg://...`).
- Pentru SQLite se aplica `PRAGMA foreign_keys=ON`.

## 5. Pornire in dezvoltare
1) Creeaza un venv si instaleaza dependintele:
   - `pip install -r backend/requirements.txt`
2) Configureaza `.env` cu valorile de mai sus.
3) Porneste aplicatia (exemple):
   - `fastapi dev` (dev server)
   - `uvicorn app.main:app --reload` (alternativ)

## 6. Lifecycle, health checks si background task
- La pornire (`lifespan`):
  - `init_minio()` creeaza bucket-urile (daca nu exista) si seteaza policy public-read.
  - ruleaza `perform_health_checks()`.
  - porneste `health_check_worker()` care verifica periodic DB + MinIO.

Endpoint health:
- `GET /health` (fara auth)
- Raspuns: `status` = `ok` | `degraded` | `down`, plus `services` si `last_checked`.

## 7. Autentificare si sesiuni
- `POST /api/v1/auth/register` – inregistrare user. Universitatea este dedusa din domeniul emailului.
- `POST /api/v1/auth/login` – login OAuth2PasswordRequestForm.
  - Seteaza cookie `access_token` (HttpOnly, SameSite=Lax, `secure` conform `COOKIE_SECURE`).
- Token JWT contine `sub` (user_id), `username`, `iat`, `exp`.
- Majoritatea endpointurilor cer user autenticat (cookie obligatoriu).

## 8. Multi-tenant si acces (RBAC)
- Fiecare user are `university_id`.
- Toate entitatile sunt filtrate by `university_id` (comunitati, postari, invitatii, search).
- Roluri in comunitate:
  - Owner: creatorul comunitatii.
  - Admin: `community_members.is_admin = true`.
  - Member: `status = approved`.
  - Pending: `status = pending` (doar pentru request-type).

Helperi cheie:
- `get_community_with_tenant_check` – valideaza `community_id` + `university_id`.
- `require_approved_member` – member approved sau owner.
- `require_community_admin` – admin sau owner.

## 9. Storage (MinIO)
- Bucket-uri standard:
  - `user-assets`
  - `community-assets`
  - `post-assets`
- Upload-ul se face direct in MinIO prin URL presignat.
- Endpoint: `POST /api/v1/storage/presigned-url`
  - Request: `{ "bucket_name": "user-assets" | "community-assets" | "post-assets" }`
  - Response: `{ "url": "...", "file_key": "..." }`

## 10. Model de date (rezumat)
Pentru schema completa vezi `docs/DATABASE_SCHEMA.md`.

Entitati principale:
- `universities` – unitati izolate (id, name, domain).
- `users` – apartin unei universitati; username/email unice.
- `communities` – apartin unei universitati; `type` = public/request/invite; `allow_anonymous`.
- `community_members` – many-to-many users x communities, cu `status` si `is_admin`.
- `community_invite_links` – linkuri cu code, expirare, max_uses.
- `community_invitations` – invitatii directe admin -> user.
- `community_join_questions` + `community_join_answers` – pentru comunitati `request`.
- `posts` – continut in comunitati, optional anonim.
- `votes` – PK compozit (user_id, post_id), value in {-1, 1}.

## 11. Conventii API
- Prefix global: `/api/v1`.
- Raspunsuri de eroare custom:
  - `{"error": {"code": "...", "message": "...", "details": ...}}`
- Validation errors (422): lista simplificata in `details`.
- IntegrityError (409): `code = CONFLICT`.
- Paginated responses:
  - `items`, `total`, `page`, `size`, `pages`.
- `page` are `ge=1`; `size` este limitat la max 100.

## 12. Endpoints (detaliat)

### 12.1 Health
- `GET /health`
  - Returneaza starea DB si MinIO. Nu necesita auth.

### 12.2 Authentication
- `POST /auth/register`
  - Body: `UserCreate` (username, email, password)
  - Email domain trebuie sa corespunda unei universitati.
  - Eroare 409 daca username/email exista.
- `POST /auth/login`
  - Body: OAuth2PasswordRequestForm (`username`, `password`).
  - Seteaza cookie `access_token` + returneaza token JSON.

### 12.3 Users
- `GET /users/me`
  - Profile privat (include email).
- `PATCH /users/me`
  - Update partial: `username`, `avatar_key`.
- `PATCH /users/me/password`
  - Schimbare parola cu validare `old_password`.
- `GET /users/{user_id}`
  - Profile public; doar in aceeasi universitate.

### 12.4 Universities
- `GET /universities`
  - Lista universitatilor (paginat).
- `GET /universities/{university_id}`
  - Detalii universitate.

### 12.5 Communities
- `POST /communities`
  - Creeaza comunitate; user devine owner + admin.
- `GET /communities`
  - Lista comunitati din universitatea curenta; include:
    - `member_count` (agregat)
    - `user_membership_status`
- `GET /communities/{community_id}`
  - Detalii comunitate; comunitatile `invite` sunt ascunse non-membrilor.
- `PATCH /communities/{community_id}`
  - Update setari; admin-only.
- `DELETE /communities/{community_id}`
  - Stergere; owner-only.
- `GET /communities/{community_id}/posts`
  - Feed comunitate; `sort=new|top`.
- `GET /communities/{community_id}/members`
  - Membri aprobati. Restrictii:
    - public: orice user autenticat
    - request/invite: doar membri aprobati
- `POST /communities/{community_id}/join`
  - public: approved instant
  - request: pending + raspunsuri la intrebari
  - invite: refuz (trebuie link/invitatie)
- `POST /communities/{community_id}/leave`
  - Owner nu poate pleca fara transfer/sterge.
- `GET /communities/{community_id}/admins`
  - Admini comunitate; restrans pentru request/invite.
- `POST /communities/{community_id}/transfer-ownership`
  - Owner-only. Noul owner trebuie sa fie membru aprobat; devine admin automat.

### 12.6 Community Admin
- `GET /communities/{id}/questions`
  - Join questions (vizibile tuturor userilor autentificati din tenant).
- `POST /communities/{id}/questions`
  - Creeaza intrebare (admin).
- `PATCH /communities/{id}/questions/{question_id}`
  - Update intrebare (admin).
- `DELETE /communities/{id}/questions/{question_id}`
  - Sterge intrebare (admin).

- `GET /communities/{id}/requests`
  - Lista cereri de join pending + raspunsuri (admin).
- `POST /communities/{id}/requests/{user_id}/approve`
  - Aproba cerere, sterge answers.
- `POST /communities/{id}/requests/{user_id}/reject`
  - Respinge cerere, sterge answers + member.

- `GET /communities/{id}/invite-links`
  - Lista invite links (admin).
- `POST /communities/{id}/invite-links`
  - Creeaza invite link cu `expires_at` si/sau `max_uses`.
- `DELETE /communities/{id}/invite-links/{link_id}`
  - Revocare invite link.

- `POST /communities/{id}/invitations`
  - Invitatie directa user (admin). Valideaza acelasi tenant.
- `PATCH /communities/{id}/members/{user_id}/role`
  - Promote/demote admin; owner nu poate fi demotat.

### 12.7 Invitations (user side)
- `GET /invite/{code}`
  - Preview invite link (validare expiry + max_uses).
- `POST /invite/{code}`
  - Accept invite link; creeaza/upgrade membership.
- `GET /me/invitations`
  - Invitatiile pending ale userului curent.
- `POST /me/invitations/{invite_id}/accept`
  - Acceptare invitatie directa (devine member aprobat).
- `POST /me/invitations/{invite_id}/decline`
  - Refuz invitatie directa.

### 12.8 Posts
- `GET /posts`
  - Global feed pentru universitatea userului.
  - Filtru: comunitati publice sau comunitati unde userul e membru aprobat.
  - `sort=new|top`.
- `POST /posts`
  - Creeaza post intr-o comunitate unde userul e membru aprobat.
  - Respecta `allow_anonymous`.
- `GET /posts/{post_id}`
  - Post single (deep link). Acces pe baza tipului de comunitate.
- `PATCH /posts/{post_id}`
  - Update doar de autor.
- `DELETE /posts/{post_id}`
  - Delete doar de autor.
- `POST /posts/{post_id}/vote`
  - `value`: 1 (upvote), -1 (downvote), 0 (withdraw).
  - Returneaza PostFeedResponse actualizat.

### 12.9 Search
- `GET /search?q=...&type=users|communities|posts&limit=...`
  - ILIKE case-insensitive, limit capped la 50.
  - `q` trebuie sa aiba min 2 caractere.
  - Rezultate limitate la universitarea userului.

### 12.10 Storage
- `POST /storage/presigned-url`
  - Returneaza URL presignat + `file_key`.
  - Util pentru upload direct catre MinIO.

## 13. Validari importante (Pydantic)
- `username`: 3-50 caractere, regex `^[a-zA-Z0-9_.-]+$`
- `password`: min 8
- `community.name`: 3-100
- `community.join_question.question`: 5-300
- `post.title`: 1-300
- `vote.value`: intre -1 si 1 (0 permis pentru clear)
- `pagination.page`: ge=1
- `pagination.size`: cap la 100

## 14. Error codes uzuale
- `BAD_REQUEST` (400)
- `NOT_FOUND` (404)
- `FORBIDDEN` (403)
- `UNAUTHORIZED` (401)
- `CONFLICT` (409)
- `INVALID_CREDENTIALS` (401)
- `ANSWERS_REQUIRED` (400)
- `INVITE_LINK_EXPIRED` (410)
- `STORAGE_UNAVAILABLE` (503)

## 15. Testing si audit
- `backend/tests/run_full_audit.py` ruleaza un audit end-to-end (DB sqlite izolata) si verifica:
  - Auth + users
  - Universities pagination
  - Community lifecycle + join flows
  - Invite links + direct invitations
  - Posts + votes
  - Search

## 16. Observatii de securitate (audit 2026-04-26)
Detalii complete in `docs/BACKEND_SECURITY_LOGIC_AUDIT_2026-04-26.md`.
Puncte importante (de urmarit la hardening):
- Verificari stricte pentru izolare tenant la invitatii directe si join questions.
- Policy pentru roluri admin (cine poate promova/demota) trebuie clarificata.
- `COOKIE_SECURE` trebuie activat in productie.
- Search cu `%term%` poate necesita indexuri trigram pentru scale.

## 17. Note operationale
- `IntegrityError` este mapat la 409 cu mesaj generic.
- Logarea se face prin `uvicorn.error`.
- `DEBUG=true` activeaza SQL echo (folositor doar in dev).
