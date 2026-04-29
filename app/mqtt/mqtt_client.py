import paho.mqtt.client as mqtt
from app.db.base import SessionLocal
from app.db import models
from datetime import UTC, datetime
import logging
import os

try:
    from app.mqtt import messages_pb2
except ImportError:
    logging.warning("messages_pb2 not found. Make sure to run protoc to generate it.")
    messages_pb2 = None

logger = logging.getLogger(__name__)

class MQTTService:
    def __init__(self, broker_url=None, port=1883):
        self.broker_url = broker_url or os.getenv("MQTT_BROKER_URL", "localhost")
        self.port = port
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="ttm4115_backend")
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.SCALE = 100_000  # Scale factor for GPS coordinates

    def on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            logger.info("Connected to MQTT Broker!")
            # Subscribe to topics
            self.client.subscribe("delivery-system/drone/+/status")
            self.client.subscribe("delivery-system/management/assignment")
            self.client.subscribe("delivery-system/management/failure")
            self.client.subscribe("delivery-system/drone/+/confirmation")
        else:
            logger.error(f"Failed to connect, return code {rc}")

    def on_message(self, client, userdata, msg):
        if not messages_pb2:
            return

        topic = msg.topic
        payload = msg.payload
        db = SessionLocal()

        try:
            if topic.endswith("/status"):
                drone_id = topic.split("/")[2]
                status_msg = messages_pb2.Status()
                status_msg.ParseFromString(payload)
                
                # Update DroneStatus in DB
                drone = db.query(models.DroneStatus).filter(models.DroneStatus.drone_id == drone_id).first()
                if not drone:
                    drone = models.DroneStatus(drone_id=drone_id)
                    db.add(drone)
                
                drone.battery = status_msg.Battery_level
                drone.gps_lat = status_msg.Latitude / self.SCALE
                drone.gps_lon = status_msg.Longitude / self.SCALE
                drone.speed = status_msg.Speed
                                
                drone.last_updated = datetime.now(UTC)
                db.commit()

            elif topic.endswith("/confirmation"):
                drone_id = topic.split("/")[2]
                confirmation_msg = messages_pb2.ArrivalConfirmation()
                confirmation_msg.ParseFromString(payload)

                order_id = str(confirmation_msg.OrderID)

                logger.info(f"Received delivery confirmation from drone {drone_id} for order {order_id}")

                # Update order status to delivered
                order = db.query(models.Order).filter(models.Order.id == order_id).first()
                if order:
                    order.status = "delivered"
                    order.drone_id = None  # Clear drone assignment on delivery
                    drone = db.query(models.DroneStatus).filter(models.DroneStatus.drone_id == drone_id).first()
                    if drone:
                        drone.current_order_id = None  # Clear current order from drone status
                    db.commit()
                    logger.info(f"Order {order_id} marked as delivered in DB.")
                else:
                    logger.error(f"Order {order_id} not found in DB to mark as delivered.")

            elif topic == "delivery-system/management/assignment":
              assignment = messages_pb2.DroneAssignment()
              assignment.ParseFromString(payload)
              drone_id = str(assignment.DroneID)
              order_id = str(assignment.OrderID)  # check your proto for exact field name
              logger.info(f"Drone {drone_id} assigned to order {order_id}")
              
              print(f"Received assignment: Drone {drone_id} -> Order {order_id}")

              db = SessionLocal()
              try:
                  order = db.query(models.Order).filter_by(id=order_id).first()
                  if order:
                      order.drone_id = drone_id
                      order.status = "dispatched"
                      order.departed_at = datetime.now(UTC)

                  drone = db.query(models.DroneStatus).filter_by(drone_id=drone_id).first()
                  if drone:
                      drone.current_order_id = order_id
                  else:
                      # Drone not yet in DB - create a minimal record
                      drone = models.DroneStatus(
                          drone_id=drone_id,
                          current_order_id=order_id,
                          battery=0.0,
                      )
                      db.add(drone)

                  db.commit()
                  logger.info(f"Order {order_id} updated to dispatched, linked to drone {drone_id}")
              except Exception as e:
                  logger.error(f"Failed to update assignment in DB: {e}")
                  db.rollback()
              finally:
                  db.close()

            # Add status "waiting for drone" in the order creation endpoint, and then update to "dispatched" when assignment message is received. This way we can track the time spent waiting for a drone.
            elif topic == "delivery-system/management/failure":
                failure = messages_pb2.AssignmentFailed()
                failure.ParseFromString(payload)
                failure_order_id = str(failure.OrderID)

                db = SessionLocal()
                try:
                    order = db.query(models.Order).filter_by(id=failure_order_id).first()
                    if order:
                        order.status = "pending"
                        db.commit()
                        logger.info(f"Order {failure_order_id} marked as drone assignment failed.")
                    else:
                        logger.error(f"Order {failure_order_id} not found in DB to mark as failed.")
                except Exception as e:
                    logger.error(f"Failed to update order status for failed assignment: {e}")
                    db.rollback()
                finally:
                    db.close()

                logger.error(f"Drone assignment failed for order {failure_order_id}. Error code: {failure.ErrCode}")
                logger.error(f"Assignment failed. Error code: {failure.ErrCode}")

        except Exception as e:
            logger.error(f"Error handling message on topic {topic}: {e}")
        finally:
            db.close()

    def start(self):
        try:
            self.client.connect(self.broker_url, self.port)
            self.client.loop_start()
        except Exception as e:
            logger.error(f"Could not connect to MQTT: {e}")

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()
        
    def publish(self, topic, payload_bytes):
        self.client.publish(topic, payload_bytes)

    def request_drone_assignment(self, lat: float, lon: float, order_id: str = None):
        if not messages_pb2:
            logger.error("messages_pb2 missing. Cannot publish.")
            return

        req = messages_pb2.AssignmentRequest()

        lat = int(lat * self.SCALE)
        lon = int(lon * self.SCALE)

        req.Latitude = lat
        req.Longitude = lon
        req.OrderID = order_id if order_id else ""

        print(f"Requesting drone assignment for order {order_id} to location ({lat}, {lon})")

        self.publish("delivery-system/management/request", req.SerializeToString())

mqtt_service = MQTTService()
