from threading import Thread
from paho.mqtt import client as mqtt
import messages_pb2 as mess

broker = "localhost"
port = 1883

class MQTT_Gateway:
    def __init__(self):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion(2), client_id='gateway')
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def on_connect(self, client, userdata, flags, rc, properties):
        print("on_connect(): {}".format(mqtt.connack_string(rc)))

    def on_message(self, client, userdata, msg):
        print("on_message(): topic: {}".format(msg.topic))
        message = format(msg.topic).split("/")[-1]
        if message == "assignment":
            payload = mess.DroneAssignment()
            payload.ParseFromString(msg.payload)
            message = mess.TaskAssignment()
            message.Latitude = payload.Latitude
            message.Longitude = payload.Longitude
            message.OrderID = payload.OrderID
            droneID = payload.DroneID
            # here you have assignment info if you wanna use it
            # ! error message is in topic failure
            self.client.publish(f"delivery-system/drone/{droneID}/assignment", message.SerializeToString())
        elif message == "failure":
            payload = mess.AssignmentFailed()
            payload.ParseFromString(msg.payload)
            errCode = payload.ErrCode
            if errCode == 503:
                print("Err 503: No available drones")
            elif errCode == 413:
                print("Err 413: Requested distance too large")

    def start(self, broker, port):
        print("Connecting to {}:{}".format(broker, port))
        self.client.connect(broker, port)

        # self.client.subscribe(f"delivery-system/drone/+/readiness")
        self.client.subscribe(f"delivery-system/management/assignment")

        try:
            thread = Thread(target=self.client.loop_forever)
            thread.start()
        except KeyboardInterrupt:
            print("Interrupted")
            self.client.disconnect()

    def send_drone_request(self, latitude, longitude):
        task = mess.AssignmentRequest()
        task.Latitude = latitude
        task.Longitude = longitude
        task.OrderID = "blablablatest"
        self.client.publish(f"delivery-system/management/request", task.SerializeToString())

# def run():
#     client = connect()
#     client.loop_start()
#     task = messages_pb2.AssignmentRequest()
#     task.Latitude = 17.4567
#     task.Longitude = -19.231736
#
#     publish(client, f"delivery-system/management/request", task.SerializeToString())
#     client.loop_stop()

if __name__ == '__main__':
    myclient = MQTT_Gateway()
    myclient.start(broker, port)
    a = 17.4567
    b = -19.231736
    myclient.send_drone_request(a, b)

