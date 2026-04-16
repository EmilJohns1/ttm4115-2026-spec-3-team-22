def test_create_user(client):
    response = client.post(
        "/users/",
        json={"email": "test@example.com", "delivery_address": "123 Test St", "payment_token": "token123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["delivery_address"] == "123 Test St"
    assert data["payment_token"] == "token123"
    assert "id" in data

def test_create_existing_user(client):
    response = client.post(
        "/users/",
        json={"email": "test@example.com"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_read_users(client):
    response = client.get("/users/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_read_user(client):
    response = client.get("/users/1")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["email"] == "test@example.com"
