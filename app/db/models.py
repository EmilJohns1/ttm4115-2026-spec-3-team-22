from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from .base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    street_address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    zip_code = Column(String, nullable=True)

class Product(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    price = Column(Float)
    currency = Column(String, default="NOK")
    image_url = Column(String)
    category = Column(String)
    available = Column(Integer, default=1)  # Using int/bool instead of boolean for wider compatibility

class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    product_id = Column(String)
    product_name = Column(String)
    status = Column(String, default="pending")
    street_address = Column(String)
    city = Column(String)
    zip_code = Column(String)
    destination_lat = Column(Float, nullable=True)
    destination_lon = Column(Float, nullable=True)
    subtotal = Column(Float)
    delivery_fee = Column(Float)
    total = Column(Float)
    currency = Column(String, default="NOK")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    departed_at = Column(DateTime, nullable=True)
    drone_id = Column(String, nullable=True)

class DroneStatus(Base):
    __tablename__ = "drone_status"
    drone_id = Column(String, primary_key=True)
    battery = Column(Float)
    gps_lat = Column(Float, nullable=True)
    gps_lon = Column(Float, nullable=True)
    current_order_id = Column(String, ForeignKey("orders.id"), nullable=True)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())