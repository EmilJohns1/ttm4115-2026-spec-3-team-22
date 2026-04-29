from pydantic import BaseModel
from typing import Optional


class PaymentIntentCreate(BaseModel):
    orderId: str


class PaymentIntentData(BaseModel):
    paymentIntentId: str
    clientSecret: str
    customerId: str
    publishableKey: Optional[str] = None


class PaymentIntentEnvelope(BaseModel):
    data: Optional[PaymentIntentData] = None
    error: Optional[dict] = None
