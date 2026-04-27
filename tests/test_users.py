from app.db import models
from app.db.base import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def test_read_user_me_not_found(client):
    response = client.get("/users/me?userId=notexist")
    assert response.status_code == 200
    assert response.json()["error"]["code"] == "NOT_FOUND"

def test_user_registration_and_login(client):
    # Test Register
    reg_resp = client.post("/users/register", json={
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "supersecretpassword123",
        "deliveryAddress": {
            "streetAddress": "101 Beta Blvd",
            "city": "Oslo",
            "zipCode": "1001"
        }
    })
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()["data"]
    assert reg_data["email"] == "jane@example.com"
    assert "" in reg_data["id"]

    # Test Duplicate Register
    dup_resp = client.post("/users/register", json={
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "anotherpassword"
    })
    assert dup_resp.status_code == 200
    assert dup_resp.json()["error"]["message"] == "Email already registered"

    # Test Login Success
    login_resp = client.post("/users/login", json={
        "email": "jane@example.com",
        "password": "supersecretpassword123"
    })
    assert login_resp.status_code == 200
    assert login_resp.json()["data"]["id"] == reg_data["id"]

    # Test Login Failure
    bad_login = client.post("/users/login", json={
        "email": "jane@example.com",
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 200
    assert bad_login.json()["error"]["message"] == "Invalid email or password"

def test_user_me_crud(client):
    # Insert via DB to test /me since POST /Users doesn't exist
    from app.db.base import Base
    from app.main import app
    from tests.conftest import TestingSessionLocal
    
    db = TestingSessionLocal()
    new_user = models.User(
        id="test123",
        name="Test User",
        email="test@user.com",
        street_address="Testvegen 1",
        city="Trondheim",
        zip_code="7030"
    )
    db.add(new_user)
    db.commit()
    db.close()

    # Test GET /users/me
    response = client.get("/users/me?userId=test123")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["id"] == "test123"
    assert data["name"] == "Test User"
    assert data["deliveryAddress"]["city"] == "Trondheim"

    # Test PATCH /users/me
    response = client.patch(
        "/users/me?userId=test123",
        json={
            "name": "Updated User",
            "deliveryAddress": {
                "streetAddress": "Nyvegen 2",
                "city": "Oslo",
                "zipCode": "1000"
            }
        }
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["name"] == "Updated User"
    assert data["deliveryAddress"]["city"] == "Oslo"
    assert data["deliveryAddress"]["streetAddress"] == "Nyvegen 2"
