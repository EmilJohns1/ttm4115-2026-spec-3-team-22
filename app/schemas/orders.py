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
    userId: str
    productId: str
    deliveryAddress: Address

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: str
    productName: str
    status: str
    amount: Amount
    createdAt: datetime
    updatedAt: datetime
    departedAt: Optional[datetime] = None

    model_config = {"from_attributes": True}

class OrderEnvelope(BaseModel):
    data: Optional[Order] = None
    error: Optional[dict] = None

class OrderListEnvelope(BaseModel):
    data: Optional[Dict[str, List[Order]]] = None
    error: Optional[dict] = None
