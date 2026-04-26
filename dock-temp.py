# TEMPORARY FILE TO TEST DRONE MACHINE
# NOT ACTUAL STM FOR DOCK

from paho.mqtt import client as mqtt_client
import messages_pb2

broker = "localhost"
port = 1883
DroneID = f'drone-{5}' # get from drone for now

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
    task = messages_pb2.TaskAssignment()
    task.Latitude = 14.3456
    task.Longitude = -122.3456
    publish(client, f"delivery-system/drone/{DroneID}/assignment", task.SerializeToString())
    client.loop_stop()

if __name__ == '__main__':
    run()

