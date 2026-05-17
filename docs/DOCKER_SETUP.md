# UniThread - Docker Setup

Ghid rapid pentru configurarea si pornirea mediului Docker.

## Structura Serviciilor

Aplicatia este compusa din 5 servicii orchestrate in docker-compose.yml:
* **db**: Baza de date PostgreSQL 16 (date persistate in ./data/postgres).
* **minio**: Stocare de obiecte S3 (date persistate in ./data/minio).
* **backend**: API FastAPI (Python 3.11) construit din ./backend.
* **frontend**: Interfata SvelteKit (Node 20) construita din ./frontend.
* **nginx**: Reverse proxy de productie (activ doar pe profilul `production`).

---

## Configurare Environment

Sistemul este configurat prin trei fisiere `.env`:

1. **Root .env** (`.env`): Definete porturile externe si credentialele pentru Postgres si MinIO.
2. **Backend .env** (`backend/.env`): Definete conexiunile si secretele JWT pentru API.
   * Pentru SQLite (implicit): `DATABASE_URL="sqlite+aiosqlite:///./unithread.db"`
   * Pentru PostgreSQL: `DATABASE_URL="postgresql+asyncpg://postgres:postgrespassword@db:5432/unithread"`
3. **Frontend .env** (`frontend/.env`): Definete URL-urile accesibile din browser-ul clientului.
   * Conexiune directa (dezvoltare): `PUBLIC_API_URL=http://localhost:8000` si `VITE_STORAGE_URL=http://localhost:9000`
   * Prin proxy Nginx (productie): `PUBLIC_API_URL=http://localhost/api` si `VITE_STORAGE_URL=http://localhost/storage`

---

## Pornirea Aplicatiei

### Modul A: SQLite (Dezvoltare)
Porneste backend-ul, frontend-ul si stocarea MinIO instant, fara a rula baza de date Postgres.

1. Asigura-te ca in `backend/.env` ai activa linia de SQLite (default).
2. Porneste serviciile:
   ```bash
   docker compose up --build backend frontend minio
   ```
3. Acceseaza:
   * Frontend: http://localhost:3000
   * API Swagger: http://localhost:8000/docs
   * Consola MinIO: http://localhost:9001

### Modul B: PostgreSQL + Nginx (Productie)
Porneste intregul stack de servicii. Nginx preia toate cererile pe portul 80, eliminand problemele de CORS.

1. In `backend/.env`, comenteaza linia SQLite si decomenteaza linia PostgreSQL:
   ```ini
   # DATABASE_URL="sqlite+aiosqlite:///./unithread.db"
   DATABASE_URL="postgresql+asyncpg://postgres:postgrespassword@db:5432/unithread"
   ```
2. In `frontend/.env`, comenteaza conexiunea directa si decomenteaza conexiunea prin proxy:
   ```ini
   # PUBLIC_API_URL=http://localhost:8000
   # VITE_STORAGE_URL=http://localhost:9000
   PUBLIC_API_URL=http://localhost/api
   VITE_STORAGE_URL=http://localhost/storage
   ```
3. Porneste stack-ul folosind profilul `production`:
   ```bash
   docker compose --profile production up --build
   ```
4. Acceseaza:
   * Aplicatia completa (Frontend): http://localhost
   * API Swagger: http://localhost/api/docs

