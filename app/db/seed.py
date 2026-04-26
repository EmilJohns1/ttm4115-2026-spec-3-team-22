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
            id=f"prd_{uuid.uuid4().hex[:8]}",
            name="Wireless Headphones",
            description="Premium ANC over-ear headphones with 30-hour battery life.",
            price=1299.00,
            currency="NOK",
            image_url="https://picsum.photos/200", # Can be replaced with an actual URL if you want a specific image
            category="audio",
            available=1
        ),
        models.Product(
            id=f"prd_{uuid.uuid4().hex[:8]}",
            name="Bluetooth Speaker",
            description="Waterproof portable speaker with 360-degree sound.",
            price=899.00,
            currency="NOK",
            image_url="https://picsum.photos/200",
            category="audio",
            available=1
        ),
        models.Product(
            id=f"prd_{uuid.uuid4().hex[:8]}",
            name="Smartphone Watch",
            description="Fitness tracker with heart-rate monitor and OLED display.",
            price=1999.00,
            currency="NOK",
            image_url="https://picsum.photos/200",
            category="wearables",
            available=1
        ),
        models.Product(
            id=f"prd_{uuid.uuid4().hex[:8]}",
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
    db.commit()
