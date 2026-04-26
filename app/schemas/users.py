from pydantic import BaseModel, EmailStr
from typing import Optional

class Address(BaseModel):
    streetAddress: str
    city: str
    zipCode: str

class UserBase(BaseModel):
    name: str
    email: EmailStr
    deliveryAddress: Optional[Address] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    deliveryAddress: Optional[Address] = None

class User(UserBase):
    id: str

    model_config = {"from_attributes": True}

class UserEnvelope(BaseModel):
    data: Optional[User] = None
    error: Optional[dict] = None
