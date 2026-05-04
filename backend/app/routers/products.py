from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..db.deps import get_db
from ..db.models import Product as DBProduct
from ..schemas.products import Product, ProductList

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=ProductList)
def get_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DBProduct)
    if search:
        query = query.filter(DBProduct.name.ilike(f"%{search}%"))
    if category:
        query = query.filter(DBProduct.category == category)

    products = query.filter(DBProduct.available == 1).all()

    items = []
    for p in products:
        items.append(Product(
            id=str(p.id),
            name=p.name,
            description=p.description,
            price=p.price,
            currency=p.currency,
            imageUrl=p.image_url,
            category=p.category,
            available=bool(p.available)
        ))

    return ProductList(items=items)

@router.get("/{product_id}", response_model=Product)
def get_product(product_id: str, db: Session = Depends(get_db)):
    p = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    return Product(
        id=str(p.id),
        name=p.name,
        description=p.description,
        price=p.price,
        currency=p.currency,
        imageUrl=p.image_url,
        category=p.category,
        available=bool(p.available)
    )
