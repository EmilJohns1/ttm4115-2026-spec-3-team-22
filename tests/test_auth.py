import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def test_user_credentials():
    return {
        "email": f"testuser_{uuid.uuid4().hex[:6]}@example.com",
        "password": "StrongPassword123!"
    }

def test_register_user(test_user_credentials):
    response = client.post(
        "/auth/register",
        json={
            "email": test_user_credentials["email"],
            "password": test_user_credentials["password"],
            "name": "Test User",
            "street_address": "Test Street 1",
            "city": "Test City",
            "zip_code": "1234"
        }
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["email"] == test_user_credentials["email"]
    assert "id" in data
    assert "hashed_password" not in data  # Ensure hashed_password is not leaked

def test_login_user(test_user_credentials):
    # Note: Login uses form data (OAuth2PasswordRequestForm standard), not JSON.
    response = client.post(
        "/auth/jwt/login",
        data={
            "username": test_user_credentials["email"],
            "password": test_user_credentials["password"]
        }
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_get_current_user(test_user_credentials):
    # First, login to get the token
    login_response = client.post(
        "/auth/jwt/login",
        data={
            "username": test_user_credentials["email"],
            "password": test_user_credentials["password"]
        }
    )
    token = login_response.json()["access_token"]

    # Use the token to access a protected route
    response = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["email"] == test_user_credentials["email"]
    assert data["name"] == "Test User"

def test_unauthorized_access():
    # Try accessing without a token
    response = client.get("/users/me")
    assert response.status_code == 401
    
    # Try accessing with an invalid token
    response_invalid = client.get(
        "/users/me",
        headers={"Authorization": "Bearer invalid_token_here"}
    )
    assert response_invalid.status_code == 401
