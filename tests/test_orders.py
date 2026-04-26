def test_create_order(client):
    order_data = {
        "userId": "usr_999",
        "productId": "prd_111",
        "deliveryAddress": {
            "streetAddress": "321 Drone St",
            "city": "Oslo",
            "zipCode": "1000"
        }
    }
    response = client.post("/orders/", json=order_data)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["userId"] == "usr_999"
    assert data["productId"] == "prd_111"
    assert data["deliveryAddress"]["city"] == "Oslo"
    assert data["status"] == "confirmed"
    assert "id" in data
    assert "createdAt" in data
    
    order_id = data["id"]
    response2 = client.get("/orders/?userId=usr_999")
    data2 = response2.json()["data"]["items"]
    assert len(data2) >= 1
    assert any(o["id"] == order_id for o in data2)

def test_read_orders_filters(client):
    # active orders
    response = client.get("/orders/active?userId=usr_999")
    assert response.status_code == 200
    data = response.json()["data"]["items"]

    assert len(data) >= 1
    assert data[0]["status"] == "confirmed"

    response2 = client.get("/orders/recent?userId=usr_999")
    assert response2.status_code == 200
    assert len(response2.json()["data"]["items"]) == 0

def test_read_single_order(client):
    # Create order first
    resp = client.post("/orders/", json={
        "userId": "usr_888",
        "productId": "prd_222",
        "deliveryAddress": {"streetAddress": "X", "city": "Y", "zipCode": "Z"}
    })
    order_id = resp.json()["data"]["id"]
    
    response = client.get(f"/orders/{order_id}")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["id"] == order_id
    assert data["productId"] == "prd_222"

def test_order_tracking(client):
    resp = client.post("/orders/", json={
        "userId": "usr_777",
        "productId": "prd_333",
        "deliveryAddress": {"streetAddress": "X", "city": "Y", "zipCode": "Z"}
    })
    order_id = resp.json()["data"]["id"]

    response = client.get(f"/orders/{order_id}/tracking")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["orderId"] == order_id
    assert "statusLabel" in data
    assert "destination" in data
    
def test_read_nonexistent_order(client):
    response = client.get("/orders/ord_doesnotexist")
    assert response.status_code == 200
    assert response.json()["error"]["code"] == "NOT_FOUND"
