def test_create_drone(client):
    response = client.post(
        "/drones/",
        json={"drone_id": "D101", "battery": 100.0, "gps_lat": 63.4305, "gps_lon": 10.3951, "speed": 15.5},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["drone_id"] == "D101"
    assert data["battery"] == 100.0
    assert data["gps_lat"] == 63.4305
    assert data["gps_lon"] == 10.3951
    assert data["speed"] == 15.5
    assert "last_updated" in data

def test_create_existing_drone(client):
    response = client.post(
        "/drones/",
        json={"drone_id": "D101", "battery": 90.0},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Drone with this ID already exists"

def test_read_drones(client):
    response = client.get("/drones/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_read_drone(client):
    response = client.get("/drones/D101")
    assert response.status_code == 200
    data = response.json()
    assert data["drone_id"] == "D101"
    assert data["battery"] == 100.0
    assert data["speed"] == 15.5

def test_update_drone(client):
    response = client.put(
        "/drones/D101",
        json={"battery": 85.5, "current_order_id": "testing123", "speed": 22.0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["drone_id"] == "D101"
    assert data["battery"] == 85.5
    assert data["speed"] == 22.0
    assert data["current_order_id"] == "testing123"

def test_read_nonexistent_drone(client):
    response = client.get("/drones/NON_EXISTENT")
    assert response.status_code == 404
    assert response.json()["detail"] == "Drone not found"
