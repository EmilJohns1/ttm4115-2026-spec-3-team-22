from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from .base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    delivery_address = Column(String, nullable=True)
    payment_token = Column(String, nullable=True)

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending")
    drone_id = Column(String, ForeignKey("drone_status.drone_id"), nullable=True)
    destination = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class DroneStatus(Base):
    __tablename__ = "drone_status"
    drone_id = Column(String, primary_key=True)
    battery = Column(Float)
    gps_lat = Column(Float, nullable=True)
    gps_lon = Column(Float, nullable=True)
    current_order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())