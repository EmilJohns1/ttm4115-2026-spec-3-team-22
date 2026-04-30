import uuid
from pydantic import BaseModel, EmailStr
from typing import Optional
from fastapi_users import schemas

class Address(BaseModel):
    streetAddress: str
    city: str
    zipCode: str

class UserRead(schemas.BaseUser[uuid.UUID]):
    name: str
    street_address: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None

class UserCreate(schemas.BaseUserCreate):
    name: str
    street_address: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None

class UserUpdate(schemas.BaseUserUpdate):
    name: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None

