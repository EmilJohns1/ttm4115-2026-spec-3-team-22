def test_create_order(client):
    # Attempt to create an order
    response = client.post(
        "/orders/",
        json={"user_id": 1, "destination": "456 Order Ave"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == 1
    assert data["destination"] == "456 Order Ave"
    assert data["status"] == "pending"
    assert "id" in data
    assert "created_at" in data

def test_read_orders(client):
    response = client.get("/orders/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_read_order(client):
    response = client.get("/orders/1")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["destination"] == "456 Order Ave"

def test_update_order(client):
    response = client.put(
        "/orders/1",
        json={"status": "shipped"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "shipped"
    assert data["id"] == 1

def test_read_nonexistent_order(client):
    response = client.get("/orders/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Order not found"
