from datetime import UTC

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db import deps, models
from app.auth import current_active_user
from app.schemas import orders as schemas
from typing import List, Optional

router = APIRouter(prefix="/orders", tags=["orders"])

def _map_to_order_schema(db_order: models.Order) -> schemas.Order:
    return schemas.Order(
        id=db_order.id,
        userId=str(db_order.user_id),
        productId=db_order.product_id,
        productName=db_order.product_name or "Unknown Product",
        status=db_order.status,
        destinationLat=db_order.destination_lat,
        destinationLon=db_order.destination_lon,
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
        departedAt=db_order.departed_at,
        drone_id=db_order.drone_id
    )

@router.post("/", response_model=schemas.OrderEnvelope)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(deps.get_db),
    user: models.User = Depends(current_active_user),
):
    import uuid
    from datetime import datetime
    try:
        from app.mqtt.mqtt_client import mqtt_service
    except ImportError:
        from app.mqtt_client import mqtt_service

    # Fetch the actual product from the database
    product = db.query(models.Product).filter(models.Product.id == order.productId).first()
    if not product:
        return schemas.OrderEnvelope(error={"code": "NOT_FOUND", "message": "Product not found"})

    from geopy.geocoders import Nominatim
    geolocator = Nominatim(user_agent="ttm4115_student_project")
    address_str = f"{order.deliveryAddress.streetAddress}, {order.deliveryAddress.zipCode} {order.deliveryAddress.city}, Norway"
    
    try:
        location = geolocator.geocode(address_str, timeout=3)
        print(f"Geocoding result for '{address_str}': {location}")
        if location:
            dest_lat = location.latitude
            dest_lon = location.longitude
            print(f"Geocoded address to lat: {dest_lat}, lon: {dest_lon}")
        else:
            dest_lat, dest_lon = 63.435, 10.4003  # default fallback (Trondheim)
    except Exception:
        dest_lat, dest_lon = 63.435, 10.4003

    new_id = f"{uuid.uuid4().hex[:8]}"
    
    delivery_fee = 2.99 # Flat fee for simplicity, could be dynamic based on distance or other factors
    subtotal = product.price or 0.0
    total_amount = subtotal + delivery_fee

    new_order = models.Order(
        id=new_id,
        user_id=str(user.id),
        product_id=order.productId,
        product_name=product.name,
        status="confirmed",
        street_address=order.deliveryAddress.streetAddress,
        city=order.deliveryAddress.city,
        zip_code=order.deliveryAddress.zipCode,
        destination_lat=dest_lat,
        destination_lon=dest_lon,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total_amount,
        currency=product.currency or "NOK",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC)
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # After saving order, request a drone to the destination
    if hasattr(mqtt_service, "request_drone_assignment"):
        mqtt_service.request_drone_assignment(lat=dest_lat, lon=dest_lon, order_id=new_order.id)

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
    
    drone_info = None
    # We query the drone status database table which is fed by our MQTT subscriber
    drone = db.query(models.DroneStatus).filter(models.DroneStatus.current_order_id == order.id).first()
    if drone:
        drone_info = {
            "latitude": drone.gps_lat,
            "longitude": drone.gps_lon,
            "updatedAt": drone.last_updated.isoformat() + "Z" if drone.last_updated else None
        }

    status_label_map = {
        "pending": "Waiting for drone",
        "confirmed": "Confirmed",
        "dispatched": "Dispatched",
        "in_transit": "On its way",
        "delivered": "Delivered",
        "cancelled": "Cancelled"
    }

    return {
        "data": {
            "orderId": order.id,
            "status": order.status,
            "statusLabel": status_label_map.get(order.status, order.status),
            "drone": drone_info,
            "destination": {
                "latitude": order.destination_lat or 63.435,
                "longitude": order.destination_lon or 10.4003
            }
        },
        "error": None
    }
