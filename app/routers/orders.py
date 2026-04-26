from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db import deps, models
from app.schemas import orders as schemas
from typing import List, Optional

router = APIRouter(prefix="/orders", tags=["orders"])

def _map_to_order_schema(db_order: models.Order) -> schemas.Order:
    return schemas.Order(
        id=db_order.id,
        userId=db_order.user_id,
        productId=db_order.product_id,
        productName=db_order.product_name or "Unknown Product",
        status=db_order.status,
        deliveryAddress=schemas.Address(
            streetAddress=db_order.street_address or "",
            city=db_order.city or "",
            zipCode=db_order.zip_code or ""
        ),
        amount=schemas.Amount(
            subtotal=db_order.subtotal or 0.0,
            deliveryFee=db_order.delivery_fee or 0.0,
            total=db_order.total or 0.0,
            currency=db_order.currency or "NOK"
        ),
        createdAt=db_order.created_at,
        updatedAt=db_order.updated_at,
        departedAt=db_order.departed_at
    )

@router.post("/", response_model=schemas.OrderEnvelope)
def create_order(order: schemas.OrderCreate, db: Session = Depends(deps.get_db)):
    import uuid
    from datetime import datetime
    new_id = f"ord_{uuid.uuid4().hex[:8]}"
    
    # Normally we would fetch the product here to get the price and name
    # For now, mock data:
    new_order = models.Order(
        id=new_id,
        user_id=order.userId,
        product_id=order.productId,
        product_name="Product " + order.productId,
        status="confirmed",
        street_address=order.deliveryAddress.streetAddress,
        city=order.deliveryAddress.city,
        zip_code=order.deliveryAddress.zipCode,
        subtotal=0.0,
        delivery_fee=2.99,
        total=2.99,
        currency="NOK",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return schemas.OrderEnvelope(data=_map_to_order_schema(new_order))

@router.get("/", response_model=schemas.OrderListEnvelope)
def read_orders(
    userId: str, 
    status: Optional[str] = None,
    db: Session = Depends(deps.get_db)
):
    query = db.query(models.Order).filter(models.Order.user_id == userId)
    if status:
        if status == "active":
            query = query.filter(models.Order.status.in_(["confirmed", "dispatched", "in_transit"]))
        else:
            query = query.filter(models.Order.status == status)
            
    db_orders = query.all()
    # The API spec has a specialized summary object, but we'll return full objects per the list
    orders = [_map_to_order_schema(o) for o in db_orders]
    return schemas.OrderListEnvelope(data={"items": orders})

@router.get("/active", response_model=schemas.OrderListEnvelope)
def read_active_orders(userId: str, db: Session = Depends(deps.get_db)):
    db_orders = db.query(models.Order).filter(
        models.Order.user_id == userId,
        models.Order.status.in_(["confirmed", "dispatched", "in_transit"])
    ).all()
    return schemas.OrderListEnvelope(data={"items": [_map_to_order_schema(o) for o in db_orders]})

@router.get("/recent", response_model=schemas.OrderListEnvelope)
def read_recent_orders(userId: str, limit: int = 3, db: Session = Depends(deps.get_db)):
    db_orders = db.query(models.Order).filter(
        models.Order.user_id == userId,
        models.Order.status == "delivered"
    ).order_by(models.Order.updated_at.desc()).limit(limit).all()
    return schemas.OrderListEnvelope(data={"items": [_map_to_order_schema(o) for o in db_orders]})

@router.get("/{order_id}", response_model=schemas.OrderEnvelope)
def read_order(order_id: str, db: Session = Depends(deps.get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        return schemas.OrderEnvelope(error={"code": "NOT_FOUND", "message": "Order not found"})
    return schemas.OrderEnvelope(data=_map_to_order_schema(order))

@router.get("/{order_id}/tracking")
def get_order_tracking(order_id: str, db: Session = Depends(deps.get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        return {"data": None, "error": {"code": "NOT_FOUND", "message": "Order not found"}}
    
    # Mocking Drone for Tracking Endpoint
    return {
        "data": {
            "orderId": order.id,
            "status": order.status,
            "statusLabel": "On its way",
            "drone": None,
            "destination": {
                "latitude": 63.435,
                "longitude": 10.4003
            }
        },
        "error": None
    }
