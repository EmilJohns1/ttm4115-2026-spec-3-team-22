from sqlalchemy.orm import sessionmaker
from tests.conftest import TestingSessionLocal, engine
from app.db.models import Product

def insert_product(product_id, name, description, price, currency="NOK", image_url="", category=""):
    db = TestingSessionLocal()
    try:
        existing = db.query(Product).filter(Product.id == product_id).first()
        if not existing:
            product = Product(
                id=product_id,
                name=name,
                description=description,
                price=price,
                currency=currency,
                image_url=image_url,
                category=category,
                available=1
            )
            db.add(product)
            db.commit()
    finally:
        db.close()

def test_create_order(client):
    insert_product("prd_111", "Drone Delivery Package", "Standard delivery package", 99.99)
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
    insert_product("prd_222", "Express Delivery Package", "Express delivery", 149.99)
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
    insert_product("prd_333", "Premium Delivery Package", "Premium package", 199.99)
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

def test_geocoding_real_trondheim_address(client):
    """Test that a valid Trondheim address gets geocoded to real coordinates."""
    insert_product("prd_geo1", "Geo Test Package", "Test product", 49.99)
    order_data = {
        "userId": "usr_geo1",
        "productId": "prd_geo1",
        "deliveryAddress": {
            "streetAddress": "Kongens gate 1",
            "city": "Trondheim",
            "zipCode": "7013"
        }
    }
    response = client.post("/orders/", json=order_data)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "confirmed"

    # Trondheim is roughly lat 63.4, lon 10.4
    # Verify we got real coordinates, not the fallback
    assert data["destinationLat"] is not None
    assert data["destinationLon"] is not None
    assert 63.3 < data["destinationLat"] < 63.5, "Latitude should be in Trondheim range"
    assert 10.2 < data["destinationLon"] < 10.6, "Longitude should be in Trondheim range"


def test_geocoding_invalid_address_uses_fallback(client):
    """Test that a nonsense address falls back to default Trondheim coords."""
    insert_product("prd_geo2", "Fallback Test Package", "Test product", 49.99)
    order_data = {
        "userId": "usr_geo2",
        "productId": "prd_geo2",
        "deliveryAddress": {
            "streetAddress": "Nonexistent Street 99999",
            "city": "Zzzztown",
            "zipCode": "0000"
        }
    }
    response = client.post("/orders/", json=order_data)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "confirmed"

    # Should have fallen back to the hardcoded default
    assert data["destinationLat"] == 63.435
    assert data["destinationLon"] == 10.4003


def test_geocoding_oslo_address(client):
    """Test that an Oslo address gets coordinates outside Trondheim range."""
    insert_product("prd_geo3", "Oslo Test Package", "Test product", 49.99)
    order_data = {
        "userId": "usr_geo3",
        "productId": "prd_geo3",
        "deliveryAddress": {
            "streetAddress": "Karl Johans gate 1",
            "city": "Oslo",
            "zipCode": "0154"
        }
    }
    response = client.post("/orders/", json=order_data)
    assert response.status_code == 200
    data = response.json()["data"]

    # Oslo is roughly lat 59.9, lon 10.7 — confirm we're NOT getting Trondheim fallback
    assert data["destinationLat"] is not None
    assert 59.7 < data["destinationLat"] < 60.1, "Latitude should be in Oslo range"
    assert 10.5 < data["destinationLon"] < 10.9, "Longitude should be in Oslo range"