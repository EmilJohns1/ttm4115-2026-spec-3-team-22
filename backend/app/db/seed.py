import uuid
from sqlalchemy.orm import Session
from app.db import models

def seed_db(db: Session):
    # Check if products already exist to avoid duplicating seed data
    if db.query(models.Product).first():
        return

    # Sample Products with Unsplash URLs
    sample_products = [
        models.Product(
            id=f"{uuid.uuid4().hex[:8]}",
            name="Wireless Headphones",
            description="Premium ANC over-ear headphones with 30-hour battery life.",
            price=1299.00,
            currency="NOK",
            image_url="https://picsum.photos/200", # Can be replaced with an actual URL if you want a specific image
            category="audio",
            available=1
        ),
        models.Product(
            id=f"{uuid.uuid4().hex[:8]}",
            name="Bluetooth Speaker",
            description="Waterproof portable speaker with 360-degree sound.",
            price=899.00,
            currency="NOK",
            image_url="https://picsum.photos/200",
            category="audio",
            available=1
        ),
        models.Product(
            id=f"{uuid.uuid4().hex[:8]}",
            name="Smartphone Watch",
            description="Fitness tracker with heart-rate monitor and OLED display.",
            price=1999.00,
            currency="NOK",
            image_url="https://picsum.photos/200",
            category="wearables",
            available=1
        ),
        models.Product(
            id=f"{uuid.uuid4().hex[:8]}",
            name="Drone Replacement Battery",
            description="High-capacity 4000mAh battery for extended flights.",
            price=499.00,
            currency="NOK",
            image_url="https://picsum.photos/200",
            category="accessories",
            available=1
        )
    ]

    db.add_all(sample_products)
    
    # 2. Seed Users
    from fastapi_users.password import PasswordHelper
    pwd_helper = PasswordHelper()
    
    sample_user_id = uuid.uuid4()
    sample_user = models.User(
        id=sample_user_id,
        name="Alice Example",
        email="alice@example.com",
        hashed_password=pwd_helper.hash("password123"),
        street_address="Olav Tryggvasons gate 1",
        city="Trondheim",
        zip_code="7011",
        is_active=True,
        is_superuser=False,
        is_verified=False
    )
    db.add(sample_user)

    # 3. Seed Drones
    drones = [
        models.DroneStatus(
            drone_id="drone-1",
            battery=85.5,
            gps_lat=63.4305,
            gps_lon=10.3951,
            speed=0.0
        ),
        models.DroneStatus(
            drone_id="drone-2",
            battery=42.0,
            gps_lat=63.4221,
            gps_lon=10.3951,
            speed=15.2
        )
    ]
    db.add_all(drones)

    # 4. Seed Orders
    from datetime import datetime, UTC, timedelta
    now = datetime.now(UTC)

    orders = [
        models.Order(
            id=f"ord_{uuid.uuid4().hex[:8]}",
            user_id=str(sample_user.id),
            product_id=sample_products[0].id,
            product_name=sample_products[0].name,
            status="pending",
            street_address="Olav Tryggvasons gate 1",
            city="Trondheim",
            zip_code="7011",
            destination_lat=63.4305,
            destination_lon=10.3951,
            subtotal=1299.00,
            delivery_fee=50.0,
            total=1349.00,
            currency="NOK",
            created_at=now - timedelta(minutes=5)
        ),
        models.Order(
            id=f"ord_{uuid.uuid4().hex[:8]}",
            user_id=str(sample_user.id),
            product_id=sample_products[1].id,
            product_name=sample_products[1].name,
            status="dispatched",
            street_address="Munkegata 2",
            city="Trondheim",
            zip_code="7013",
            destination_lat=63.4300,
            destination_lon=10.3980,
            subtotal=899.00,
            delivery_fee=50.0,
            total=949.00,
            currency="NOK",
            created_at=now - timedelta(hours=1),
            departed_at=now - timedelta(minutes=45),
            drone_id="drone-2" # linked to drone-2
        ),
        models.Order(
            id=f"ord_{uuid.uuid4().hex[:8]}",
            user_id=str(sample_user.id),
            product_id=sample_products[2].id,
            product_name=sample_products[2].name,
            status="completed",
            street_address="Gata 3",
            city="Trondheim",
            zip_code="7014",
            destination_lat=63.4250,
            destination_lon=10.3920,
            subtotal=1999.00,
            delivery_fee=0.0, # free delivery
            total=1999.00,
            currency="NOK",
            created_at=now - timedelta(days=1),
            departed_at=now - timedelta(hours=23),
            drone_id="drone-1"
        )
    ]
    
    # Update drone-2 to be currently active on the dispatched order
    drones[1].current_order_id = orders[1].id
    
    db.add_all(orders)
    db.commit()
