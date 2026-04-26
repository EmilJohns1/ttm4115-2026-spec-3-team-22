from paho.mqtt import client as mqtt_client
import messages_pb2

broker = "localhost"
port = 1883
# topic = "test"


def connect():
    def on_connect(self, client, userdata, flags, rc):
        print("rc: "+str(rc))
    client = mqtt_client.Client(mqtt_client.CallbackAPIVersion(2), client_id=f'tester')
    client.on_connect = on_connect
    client.connect(broker, port)
    return client

def publish(client, topic, payload):
    # msg = f"{payload}"
    result = client.publish(topic, payload)
    if result[0] == 0:
        print("Published")
    else:
        print("Not published")

def run():
    client = connect()
    client.loop_start()
    task = messages_pb2.AssignmentRequest()
    task.Latitude = 17.4567
    task.Longitude = -19.231736

    publish(client, f"delivery-system/management/request", task.SerializeToString())
    client.loop_stop()

if __name__ == '__main__':
    run()

