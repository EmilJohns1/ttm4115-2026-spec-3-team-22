# ttm4115-backend

A sample **FastAPI** backend project for TTM4115.

## Features

- RESTful API for an e-commerce & drone delivery platform (Users, Products, Orders, Drones).
- SQLite Database integration via SQLAlchemy ORM (Flattened relational data).
- Pydantic v2 schemas mapping nested JSON to flat database fields (`Address`, `Amount`).
- Standardized API Response Envelopes (`{ "data": {}, "error": null }`).
- Built-in User Authentication (Registration / Login) with PBKDF2 password hashing and salting.
- Automatic Database Seeding (injects sample products with randomized 200 x 200 images on startup).
- Auto-generated interactive docs at `/docs` (Swagger UI) and `/redoc`.
- Pytest test suite that runs against an in-memory SQLite database.

## Project structure

```
.
├── app/
│   ├── main.py          # FastAPI application & lifespan startup hooks
│   ├── db/
│   │   ├── base.py      # SQLAlchemy setup & base definitions
│   │   ├── deps.py      # FastAPI Dependency Injection (get_db)
│   │   ├── models.py    # SQLAlchemy flattened database models
│   │   └── seed.py      # Automatic database seeding logic
│   ├── routers/
│   │   ├── users.py     # Auth & user profile operations
│   │   ├── products.py  # Products catalog
│   │   ├── orders.py    # Orders & drone tracking endpoints
│   │   └── drones.py    # Drone telemetry
│   └── schemas/
│       ├── users.py     # User schemas (incl. auth)
│       ├── products.py  # Product schemas
│       ├── orders.py    # Order schemas & nested data wrappers
│       └── drones.py    # Drone schemas
├── api-spec-trimmed.md  # Detailed API specifications mapping
├── tests/
│   ├── conftest.py      # Test overrides and database fixtures
│   ├── test_users.py
│   ├── test_products.py
│   ├── test_orders.py
│   └── test_drones.py
├── requirements.txt
├── Dockerfile           # Docker image setup
├── docker-compose.yml   # Docker Compose configuration
└── README.md
```

## Getting started (Using Docker)

The easiest way to run the backend is by using Docker Compose. This runs your app on port `8000` with hot-reloading enabled.

### 1. Build and Run

```bash
docker-compose up --build
```

The API is now available at <http://localhost:8000>.  
Interactive docs: <http://localhost:8000/docs>

---

## Getting started (Local Setup)

If you prefer running without Docker:

### 1. Create and activate a virtual environment

```bash
# Windows
python -m venv .venv
.\.venv\Scripts\activate

# Mac/Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the development server

```bash
uvicorn app.main:app --reload
or
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

_Note: The database is automatically seeded with sample products (with Lorem Picsum images) when the server starts!_

## API Endpoints (Core overview)

Most endpoints return data modeled by our standardized envelope: `{ "data": <object>, "error": <error_object> }`.

- **Auth**: `POST /auth/jwt/register`, `POST /auth/jwt/login`, `POST /auth/jwt/logout`
  **Users**: `GET /users/me`, `PATCH /users/me`, `GET /users/{id}`, `PATCH /users/{id}`, `DELETE /users/{id}`
- **Products**: `GET /products` (with `search` and `category` filters), `GET /products/{id}`
- **Orders**: `POST /orders`, `GET /orders` (with `userId` filters), `GET /orders/active`, `GET /orders/recent`, `GET /orders/{id}`, `GET /orders/{id}/tracking`
- **Drones**: Internal telemetry REST routes (simulated MQTT ingestion).

See `http://localhost:8000/docs` while running for the full interactive schema!

## Running Tests

Tests execute against an isolated testing SQLite database (`test.db`), avoiding conflicts with local dev data.

```bash
pytest tests/ -v
```
