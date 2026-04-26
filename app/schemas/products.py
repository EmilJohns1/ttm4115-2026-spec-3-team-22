from pydantic import BaseModel
from typing import Optional, List

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    currency: str = "NOK"
    imageUrl: str
    category: str
    available: bool = True

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: str

    model_config = {"from_attributes": True}

class ProductEnvelope(BaseModel):
    data: Optional[Product] = None
    error: Optional[dict] = None

class ProductListEnvelope(BaseModel):
    data: Optional[dict] = None  # Expected shape {"items": [Product, ...]}
    error: Optional[dict] = None
