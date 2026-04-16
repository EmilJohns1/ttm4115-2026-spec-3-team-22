import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import items as items_router


@pytest.fixture(autouse=True)
def reset_db():
    """Reset the in-memory store before every test."""
    items_router._db.clear()
    items_router._next_id = 1
    yield


@pytest.fixture
def client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------


def test_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the TTM4115 Backend API!"}


# ---------------------------------------------------------------------------
# Items CRUD
# ---------------------------------------------------------------------------


def test_list_items_empty(client: TestClient):
    response = client.get("/items/")
    assert response.status_code == 200
    assert response.json() == []


def test_create_item(client: TestClient):
    payload = {"name": "Hammer", "description": "A useful tool", "price": 9.99}
    response = client.post("/items/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 1
    assert data["name"] == "Hammer"
    assert data["price"] == 9.99


def test_list_items_after_create(client: TestClient):
    client.post("/items/", json={"name": "Screwdriver", "price": 4.49})
    response = client.get("/items/")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_item(client: TestClient):
    client.post("/items/", json={"name": "Wrench", "price": 12.00})
    response = client.get("/items/1")
    assert response.status_code == 200
    assert response.json()["name"] == "Wrench"


def test_get_item_not_found(client: TestClient):
    response = client.get("/items/999")
    assert response.status_code == 404


def test_update_item(client: TestClient):
    client.post("/items/", json={"name": "Nail", "price": 0.10})
    response = client.put("/items/1", json={"price": 0.20})
    assert response.status_code == 200
    assert response.json()["price"] == 0.20
    assert response.json()["name"] == "Nail"


def test_update_item_not_found(client: TestClient):
    response = client.put("/items/999", json={"price": 1.00})
    assert response.status_code == 404


def test_delete_item(client: TestClient):
    client.post("/items/", json={"name": "Bolt", "price": 0.05})
    response = client.delete("/items/1")
    assert response.status_code == 204
    assert client.get("/items/1").status_code == 404


def test_delete_item_not_found(client: TestClient):
    response = client.delete("/items/999")
    assert response.status_code == 404


def test_create_item_invalid_price(client: TestClient):
    """Price must be > 0."""
    response = client.post("/items/", json={"name": "Free", "price": 0})
    assert response.status_code == 422


def test_create_item_empty_name(client: TestClient):
    """Name must not be empty."""
    response = client.post("/items/", json={"name": "", "price": 1.00})
    assert response.status_code == 422
