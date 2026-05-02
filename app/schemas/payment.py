from pydantic import BaseModel
from typing import Optional


class PaymentIntentCreate(BaseModel):
    orderId: str


class PaymentIntentData(BaseModel):
    paymentIntentId: str
    clientSecret: str
    customerId: str
    ephemeralKeySecret: Optional[str] = None
    publishableKey: Optional[str] = None


class SetupIntentData(BaseModel):
    setupIntentId: str
    clientSecret: str
    customerId: str
    publishableKey: Optional[str] = None


class SavedCard(BaseModel):
    id: str
    brand: str
    last4: str
    expMonth: int
    expYear: int
    isDefault: bool = False


class PaymentMethodsData(BaseModel):
    methods: list[SavedCard]
    defaultPaymentMethodId: Optional[str] = None
