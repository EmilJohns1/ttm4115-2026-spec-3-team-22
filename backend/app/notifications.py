import logging
import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_delivery_notification(push_token: str, order_id: str) -> None:
    try:
        payload = {
            "to": push_token,
            "title": "Your order has arrived!",
            "body": "Your delivery has been completed.",
            "data": {"order_id": order_id, "type": "delivery_completed"},
            "priority": "high",
            "sound": "default",
        }
        with httpx.Client() as client:
            response = client.post(EXPO_PUSH_URL, json=payload)
            response.raise_for_status()
        logger.info(f"Push notification sent for order {order_id}")
    except Exception as e:
        logger.error(f"Failed to send push notification for order {order_id}: {e}")
