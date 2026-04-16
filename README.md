# ttm4115-backend

A sample **FastAPI** backend project for TTM4115.

## Features

- RESTful CRUD API for an *Items* resource
- Pydantic v2 request / response validation
- Auto-generated interactive docs at `/docs` (Swagger UI) and `/redoc`
- pytest test suite

## Project structure

```
.
├── app/
│   ├── main.py          # FastAPI application & root endpoint
│   ├── models.py        # Pydantic schemas
│   └── routers/
│       └── items.py     # /items CRUD router
├── tests/
│   └── test_items.py    # pytest tests
├── requirements.txt
└── README.md
```

## Getting started

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

The API is now available at <http://localhost:8000>.  
Interactive docs: <http://localhost:8000/docs>

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Welcome / health-check |
| GET | `/items/` | List all items |
| POST | `/items/` | Create an item |
| GET | `/items/{id}` | Get a single item |
| PUT | `/items/{id}` | Update an item |
| DELETE | `/items/{id}` | Delete an item |

## Running tests

```bash
pytest tests/ -v
```