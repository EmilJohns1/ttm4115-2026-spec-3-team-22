from pydantic import BaseModel
from typing import List

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

class ProductList(BaseModel):
    items: List[Product]
