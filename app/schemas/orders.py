from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OrderBase(BaseModel):
    user_id: int
    status: str = "pending"
    drone_id: Optional[str] = None
    destination: str

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    drone_id: Optional[str] = None

class Order(OrderBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
