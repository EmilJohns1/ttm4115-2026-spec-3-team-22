from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    delivery_address: Optional[str] = None
    payment_token: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    delivery_address: Optional[str] = None
    payment_token: Optional[str] = None

class User(UserBase):
    id: int

    model_config = {"from_attributes": True}
