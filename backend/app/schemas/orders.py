from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class Address(BaseModel):
    streetAddress: str
    city: str
    zipCode: str

class Amount(BaseModel):
    subtotal: float
    deliveryFee: float
    total: float
    currency: str

class OrderBase(BaseModel):
    productId: str
    deliveryAddress: Address

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    userId: str
    id: str
    productName: str
    status: str
    amount: Amount
    createdAt: datetime
    updatedAt: datetime
    destinationLat: Optional[float] = None
    destinationLon: Optional[float] = None
    departedAt: Optional[datetime] = None
    drone_id: Optional[str] = None

    model_config = {"from_attributes": True}

class OrderList(BaseModel):
    items: List[Order]
