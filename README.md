# Mini Service Desk

FastAPI + React implementation of a lightweight service desk where employees can open IT requests, collaborate with operators through comments, and track progress via a modern UI. The goal is to have a deployable reference that still feels realistic: SQLModel models, JWT auth, admin dashboards, and Pytest coverage.

## Highlights

- FastAPI backend with OAuth2 password flow, JWT auth, and typed SQLModel models for users, tickets, and ticket comments.
- React 19 + Vite frontend with role-aware routing, ticket creation flow, admin dashboard, ticket detail & comment threads.
- SQLite by default for frictionless local work, with optional PostgreSQL connection via `DATABASE_URL`.
- Docker Compose setup builds both services and persists data volume for the API, and the stack is already deployed on Render for a zero-install demo.
- Pytest suite exercises ticket and comment flows end-to-end using FastAPI's TestClient.

## Tech stack

- **Backend:** FastAPI, SQLModel, SQLite/PostgreSQL, JWT (PyJWT) authentication.
- **Frontend:** React 19, Vite, React Router, custom hooks for auth and API calls.
- **Tooling:** pytest, uvicorn, npm, Docker/Docker Compose.

## Project structure

```
mini-service-desk/
├── app/                # FastAPI application (routers, models, services)
├── frontend/           # React + Vite single-page app
├── tests/              # Pytest suites for API flows
├── Dockerfile.*        # Docker images for backend & frontend
├── compose.yaml        # One-command full stack
├── pyproject.toml      # Python project metadata
└── requirements.txt    # Locked backend dependencies
```

## Getting started (local development)

Already want to try it without installing anything? The stack is deployed on Render:

- Backend API: https://mini-service-desk.onrender.com/
- Frontend SPA: https://mini-service-desk-1.onrender.com/

Grab the URLs above to explore the live environment. When you need to make changes or run tests, follow the steps below to reproduce the same setup locally.

### 1. Requirements

- Python 3.12+
- Node.js 20+ with npm
- SQLite (bundled with Python) or a PostgreSQL instance if you override `DATABASE_URL`
- Docker (optional, only needed for the Compose workflow)

### 2. Backend (FastAPI)

```bash
# create the virtual environment
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# install everything declared in pyproject.toml / uv.lock
uv sync

export DATABASE_URL="sqlite:///./database.db"
export FRONTEND_URL="http://localhost:5173"
export ENV="dev"
# Note: the code currently expects SECRTET_KEY (typo) – match the variable name
export SECRTET_KEY="replace-with-a-long-random-string"

uv run uvicorn app.main:app --reload --port 8000
```

- The first run automatically creates the SQLite file and tables through `app.database.init_db`.
- Interactive docs are exposed at `http://localhost:8000/docs` (only when `ENV != "prod"`).
- To seed your first admin, call `POST /api/users` with `"is_admin": true`, then sign in through the UI.

Example user bootstrap:

```bash
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","password":"admin1234","is_admin":true}'
```

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
# point the Vite proxy at the backend you just started
VITE_BACKEND_URL="http://localhost:8000" npm run dev -- --host 0.0.0.0 --port 5173
```

- The Vite dev server proxies `/api` calls to `VITE_BACKEND_URL`, so set it to wherever the FastAPI service runs.
- If you are consuming a deployed API instead of proxying, set `VITE_API_BASE_URL=https://your-api.example.com` so the `apiFetch` helper reaches the correct origin.
- The app exposes `/login`, `/tickets`, `/tickets/:id`, and `/admin` routes. Admin-only pages are wrapped with `RequireAdmin`.

### 4. Running everything with Docker Compose

```bash
docker compose up --build
```

- Backend is served on `http://localhost:8000`, frontend on `http://localhost:5173`.
- Ticket data is persisted in the named `db-data` volume (SQLite inside the backend container).
- Hot reload works because the project directories are mounted into the containers. Use this workflow when you want parity with production networking (the frontend resolves the backend service name).

## Environment variables

| Name            | Default                     | Description |
|-----------------|-----------------------------|-------------|
| `DATABASE_URL`  | `sqlite:///database.db`     | SQLModel connection string; set to `postgresql+psycopg://…` for Postgres. |
| `ENV`           | `dev`                       | When set to `prod`, disables FastAPI docs/OpenAPI routes and SQL echo. |
| `FRONTEND_URL`  | `http://localhost:5173`     | Allowed origin for CORS. |
| `SECRTET_KEY`   | hard-coded fallback         | Secret used when signing JWTs (`SECRTET_KEY` spelling matches the code). |
| `PORT`          | `8000`                      | Used by Render/heroku-style platforms; uvicorn falls back to 8000 locally. |
| `VITE_BACKEND_URL` | `http://backend:8000`   | Target the Vite dev server proxies `/api` requests to; override to `http://localhost:8000` outside Docker. |
| `VITE_API_BASE_URL` | empty                  | Absolute base URL passed to `apiFetch` when you do not rely on the `/api` proxy. |

## API overview

| Method & Path | Description | Auth |
|---------------|-------------|------|
| `POST /api/users` | Register a new user; include `is_admin: true` for operators. | none |
| `POST /api/users/login` | OAuth2 password-style login (`username` = email) returning a bearer token. | Basic form |
| `GET /api/users/me` | Current user profile. | Bearer |
| `GET /api/users/operators` | List admins/operators (used in Admin UI). | Bearer, admin only |
| `GET /api/users/search?q=` | Partial name search for submitter auto-complete. | Bearer, admin only |
| `POST /api/tickets/` | Create a ticket; status defaults to `new`. | Bearer |
| `GET /api/tickets/` | List tickets (requester sees their own, admins see all). | Bearer |
| `PATCH /api/tickets/{id}` | Requesters can edit descriptions, admins can edit status/assignment/urgency. | Bearer |
| `DELETE /api/tickets/{id}` | Remove a ticket. | Bearer, admin only |
| `GET /api/tickets/{id}/comments` | List threaded comments with author names. | Bearer (ticket owner/admin) |
| `POST /api/tickets/{id}/comments` | Add a comment. | Bearer (ticket owner/admin) |

- Ticket statuses: `new`, `assigned`, `pending`, `closed`. Setting `operator_id` automatically transitions `new → assigned` unless status is explicitly provided.
- Comments are sorted chronologically and stored separately for history.

## Testing

```bash
uv run pytest
```

- Tests are located in `tests/` and use an ephemeral SQLite database via `conftest.py`. Each run deletes `test.db`, creates tables, and restores overrides for `get_session`.
- The suites cover ticket creation/listing, user permissions, and ticket comments. Add new tests alongside existing helpers such as `auth_header` and `login` for consistency.

> Need an additional backend dependency? Run `uv add <package>` (or `uv add --dev <package>` for dev-only) so both `pyproject.toml` and `uv.lock` stay in sync.

## Common workflows

- **Create a requester:** use the Tickets page to open issues and add follow-up comments.
- **Act as an admin:** log in with an admin account to view `/admin`, filter tickets (quick filters + advanced modal), assign operators, or close requests.
- **Call the API directly:** follow the `API overview` table; remember that FastAPI expects bearer tokens in the `Authorization` header (e.g., `Authorization: Bearer <token>`).

Happy hacking!
