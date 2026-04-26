import paho.mqtt.client as mqtt
from app.db.base import SessionLocal
from app.db import models
from datetime import UTC, datetime
import logging

try:
    import messages_pb2
except ImportError:
    logging.warning("messages_pb2 not found. Make sure to run protoc to generate it.")
    messages_pb2 = None

logger = logging.getLogger(__name__)

class MQTTService:
    def __init__(self, broker_url="localhost", port=1883):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.broker_url = broker_url
        self.port = port

    def on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            logger.info("Connected to MQTT Broker!")
            # Subscribe to topics
            self.client.subscribe("delivery-system/drone/+/status")
            self.client.subscribe("delivery-system/management/assignment")
            self.client.subscribe("delivery-system/management/failure")
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
                drone.gps_lat = status_msg.Latitude
                drone.gps_lon = status_msg.Longitude
                # drone.speed is in status_msg.Speed but not currently tracked in the model
                drone.last_updated = datetime.now(UTC)
                db.commit()

            elif topic == "delivery-system/management/assignment":
              assignment = messages_pb2.DroneAssignment()
              assignment.ParseFromString(payload)
              drone_id = str(assignment.DroneID)
              order_id = str(assignment.OrderID)  # check your proto for exact field name
              logger.info(f"Drone {drone_id} assigned to order {order_id}")

              db = SessionLocal()
              try:
                  order = db.query(models.Order).filter_by(id=order_id).first()
                  if order:
                      order.drone_id = drone_id
                      order.status = "dispatched"

                  drone = db.query(models.DroneStatus).filter_by(drone_id=drone_id).first()
                  if drone:
                      drone.current_order_id = order_id
                  else:
                      # Drone not yet in DB — create a minimal record
                      drone = models.DroneStatus(
                          drone_id=drone_id,
                          current_order_id=order_id,
                          battery=None
                      )
                      db.add(drone)

                  db.commit()
                  logger.info(f"Order {order_id} updated to dispatched, linked to drone {drone_id}")
              except Exception as e:
                  logger.error(f"Failed to update assignment in DB: {e}")
                  db.rollback()
              finally:
                  db.close()

            elif topic == "delivery-system/management/failure":
                failure = messages_pb2.AssignmentFailed()
                failure.ParseFromString(payload)
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

    def request_drone_assignment(self, lat: float, lon: float):
        if not messages_pb2:
            logger.error("messages_pb2 missing. Cannot publish.")
            return

        req = messages_pb2.AssignmentRequest()
        req.Latitude = lat
        req.Longitude = lon
        self.publish("delivery-system/management/request", req.SerializeToString())

mqtt_service = MQTTService()
