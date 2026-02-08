# Mini Service Desk

A lightweight IT Service Desk platform built with **FastAPI**, **React 19**, and **Ollama AI**.

---

## Features

- **AI Ticket Creation** - Describe your issue in natural language; the integrated Ollama agent extracts details and creates structured tickets automatically.
- **JWT Authentication** - OAuth2 Password Grant with Argon2id password hashing and role-based access control (RBAC).
- **Rate Limiting** - Login: 5 requests/min, Registration: 3 requests/min.
- **CSV Export** - Export ticket data for external reporting.
- **Security Headers** - CSP, HSTS, X-Frame-Options, and XSS protection.
- **One-Command Deployment** - Entire stack runs via Docker Compose.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Docker](https://docs.docker.com/get-docker/) | 20+ | Container runtime |
| [Docker Compose](https://docs.docker.com/compose/install/) | v2+ | Multi-container orchestration |

For local development without Docker, you also need:

| Tool | Version | Purpose |
|------|---------|---------|
| [Python](https://www.python.org/) | 3.12+ | Backend runtime |
| [uv](https://docs.astral.sh/uv/) | latest | Python package manager |
| [Node.js](https://nodejs.org/) | 20+ | Frontend runtime |
| [Redis](https://redis.io/) | latest | Caching (optional locally) |
| [Ollama](https://ollama.com/) | latest | Local LLM for AI features |

---

## Quick Start (Docker)

This is the easiest way to get the full platform running:

```bash
# Clone the repository
git clone https://github.com/<your-username>/mini-service-desk.git
cd mini-service-desk

# Start the entire stack (Frontend, Backend, Redis, Ollama)
docker compose up --build
```

Once the services are up:

| Service | URL |
|---------|-----|
| Frontend UI | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

### Create an Admin User

After starting the stack, seed an admin user:

```bash
docker compose exec backend python scripts/seed_admin.py
```

This creates a default admin with:
- **Email:** `admin@example.com`
- **Password:** `Admin123!`

To customize credentials, pass environment variables:

```bash
docker compose exec -e ADMIN_EMAIL=you@example.com -e ADMIN_PASSWORD="YourPass123!" backend python scripts/seed_admin.py
```

> Password requirements: 8+ characters, at least one uppercase, one lowercase, one number, and one symbol.

---

## Local Development Setup

If you prefer running services individually without Docker:

### 1. Backend (FastAPI)

```bash
# Create and activate virtual environment
uv venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Install dependencies
uv sync

# Initialize database and seed admin user
python scripts/seed_admin.py

# Start the backend server
uv run uvicorn app.main:app --reload
```

The backend will be available at http://localhost:8000.

### 2. Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (with proxy pointing to local backend)
VITE_BACKEND_URL=http://localhost:8000 npm run dev
```

The frontend will be available at http://localhost:5173.

> **Note:** The `VITE_BACKEND_URL` env var tells the Vite dev server to proxy `/api` requests to your local backend instead of the Docker service name.

### 3. Redis (optional)

If you want caching and rate limiting locally:

```bash
# macOS
brew install redis && redis-server

# Or via Docker
docker run -d -p 6379:6379 redis:alpine
```

Set the environment variable before starting the backend:

```bash
export REDIS_URL=redis://localhost:6379/0
```

### 4. Ollama (optional)

If you want AI-powered ticket creation locally:

```bash
# Install Ollama from https://ollama.com
ollama pull llama3.2:1b
ollama serve
```

Set the environment variable before starting the backend:

```bash
export OLLAMA_HOST=http://localhost:11434
export OLLAMA_MODEL=llama3.2:1b
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `dev-secret-key-change-in-prod` | JWT signing key (**change in production**) |
| `ENV` | `dev` | Set to `prod` for production mode |
| `DATABASE_URL` | `sqlite:///database.db` | Database connection string |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection URL |
| `OLLAMA_HOST` | `http://ollama:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `llama3.2:1b` | LLM model name |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |
| `ADMIN_EMAIL` | `admin@example.com` | Admin email for seed script |
| `ADMIN_PASSWORD` | `Admin123!` (dev only) | Admin password for seed script |

---

## Testing

```bash
# Activate virtual environment
source .venv/bin/activate

# Run all tests
pytest

# Run specific test suites
pytest tests/test_security.py -v   # Security and auth tests
pytest tests/test_refresh.py -v    # Async and idempotency tests
```

---

## Project Structure

```
mini-service-desk/
├── app/                    # FastAPI backend
│   ├── main.py             # Application entry point
│   ├── database.py         # Database setup
│   ├── models/             # SQLModel database models
│   ├── routers/            # API endpoint handlers
│   │   ├── chat.py         # AI chat / ticket creation
│   │   ├── comments.py     # Ticket comments
│   │   ├── export.py       # CSV export
│   │   ├── health.py       # Health check
│   │   ├── tickets.py      # Ticket CRUD
│   │   └── users.py        # Auth and user management
│   ├── services/           # Business logic
│   └── middleware/          # Security headers
├── frontend/               # React 19 + Vite frontend
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── auth/           # Authentication logic
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   └── pages/          # Page components
│   └── vite.config.js      # Vite + proxy configuration
├── scripts/                # Utilities
│   └── seed_admin.py       # Admin user seeder
├── tests/                  # Test suite
├── compose.yaml            # Docker Compose config
├── Dockerfile.backend      # Backend container
├── Dockerfile.frontend     # Frontend container
└── pyproject.toml          # Python project config
```

---

## Troubleshooting

**Backend won't start:**
```bash
docker compose logs backend
```

**Redis connection failed:**
```bash
docker compose exec redis redis-cli ping
# Expected: PONG
```

**Ollama model not loading:**
```bash
docker compose exec ollama ollama pull llama3.2:1b
```

**Frontend can't reach backend (local dev):**
Make sure you set `VITE_BACKEND_URL=http://localhost:8000` when starting the frontend dev server.
