# ttm4115-backend

A sample **FastAPI** backend project for TTM4115.

## Features

- RESTful CRUD API for multiple resources (Users, Orders, Drones, Items).
- SQLite Database integration via SQLAlchemy ORM.
- Pydantic v2 request / response validation.
- Auto-generated interactive docs at `/docs` (Swagger UI) and `/redoc`
- pytest test suite that runs against an in-memory SQLite database.

## Project structure

```
.
├── app/
│   ├── main.py          # FastAPI application & root endpoint
│   ├── db/
│   │   ├── base.py      # SQLAlchemy setup & base definitions
│   │   ├── deps.py      # FastAPI Dependency Injection (get_db)
│   │   └── models.py    # SQLAlchemy database models
│   ├── routers/
│   │   ├── users.py     # /users CRUD operations
│   │   ├── orders.py    # /orders CRUD operations
│   │   └── drones.py    # /drones CRUD operations
│   └── schemas/
│       ├── users.py     # User Pydantic schemas
│       ├── orders.py    # Order Pydantic schemas
│       └── drones.py    # Drone Pydantic schemas
├── tests/
│   ├── conftest.py      # Test overrides and database fixtures
│   ├── test_users.py    # pytest tests for users
│   ├── test_orders.py   # pytest tests for orders
│   └── test_drones.py   # pytest tests for drones
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
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the development server

```bash
uvicorn app.main:app --reload
```

## Running Tests

Tests execute against an isolated in-memory SQLite database, so they will not affect your local `.db` file.

To run the suite locally:

```bash
pytest tests/
```

## API endpoints

Will add later, can be found at /docs or /redoc

## Running tests

```bash
pytest tests/ -v
```
