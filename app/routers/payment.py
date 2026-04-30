import json
import logging
import os
from datetime import UTC, datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import stripe

from app.auth import current_active_user
from app.db import deps, models
from app.schemas.payment import (
    PaymentIntentCreate,
    PaymentIntentData,
)

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger(__name__)


def _to_minor_units(amount: float) -> int:
    return int(round(amount * 100))


@router.post("/intent", response_model=PaymentIntentData)
def create_payment_intent(
    payload: PaymentIntentCreate,
    db: Session = Depends(deps.get_db),
    user: models.User = Depends(current_active_user),
):
    stripe_secret = os.getenv("STRIPE_SECRET_KEY")
    if not stripe_secret:
        raise HTTPException(status_code=500, detail="Stripe is not configured")

    stripe.api_key = stripe_secret

    order = db.query(models.Order).filter(models.Order.id == payload.orderId).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.user_id != str(user.id):
        raise HTTPException(status_code=403, detail="Order does not belong to user")

    db_user = db.query(models.User).filter(models.User.id == user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not db_user.stripe_customer_id:
        try:
            customer = stripe.Customer.create(
                email=db_user.email,
                name=db_user.name,
                metadata={"user_id": str(db_user.id)},
            )
        except stripe.error.StripeError as exc:
            raise HTTPException(status_code=502, detail=f"Stripe error: {exc.user_message or str(exc)}") from exc

        db_user.stripe_customer_id = customer.id
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    amount_minor = _to_minor_units(order.total or 0.0)
    if amount_minor <= 0:
        raise HTTPException(status_code=422, detail="Order total is invalid")

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_minor,
            currency=(order.currency or "NOK").lower(),
            customer=db_user.stripe_customer_id,
            automatic_payment_methods={"enabled": True},
        )
    except stripe.error.StripeError as exc:
        raise HTTPException(status_code=502, detail=f"Stripe error: {exc.user_message or str(exc)}") from exc

    order.payment_intent_id = intent.id
    order.updated_at = datetime.now(UTC)
    db.add(order)
    db.commit()
    db.refresh(order)

    return PaymentIntentData(
        paymentIntentId=intent.id,
        clientSecret=intent.client_secret,
        customerId=db_user.stripe_customer_id,
        publishableKey=os.getenv("STRIPE_PUBLISHABLE_KEY"),
    )

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(deps.get_db)):
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    
    payload = await request.body()
    event = None

    try:
        event = json.loads(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid payload") from exc

    if webhook_secret:
        sig_header = request.headers.get("stripe-signature")
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except stripe.error.SignatureVerificationError as exc:
            raise HTTPException(status_code=400, detail="Invalid signature") from exc

    logger.info("Stripe webhook received: id=%s type=%s", event["id"], event["type"])

    if event["type"] != "payment_intent.succeeded":
        return {"received": True}

    intent = event["data"]["object"]
    intent_id = intent.get("id") if isinstance(intent, dict) else intent.id
    if not intent_id:
        return {"received": True}

    order = db.query(models.Order).filter(models.Order.payment_intent_id == intent_id).first()
    if not order:
        return {"received": True}

    if order.status != "confirmed":
        order.status = "confirmed"
        order.updated_at = datetime.now(UTC)
        db.add(order)
        db.commit()
        db.refresh(order)

        try:
            from app.mqtt.mqtt_client import mqtt_service
        except ImportError:
            from app.mqtt_client import mqtt_service

        if hasattr(mqtt_service, "request_drone_assignment"):
            mqtt_service.request_drone_assignment(
                lat=order.destination_lat or 63.435,
                lon=order.destination_lon or 10.4003,
                order_id=order.id,
            )

    return {"received": True}

