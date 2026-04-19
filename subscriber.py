from paho.mqtt import client as mqtt_client
import messages_pb2

broker = "localhost"
port = 1883

def connect():
    def on_connect(self, client, userdata, flags, rc):
        print("rc: "+str(rc))
    client = mqtt_client.Client(mqtt_client.CallbackAPIVersion(2), client_id=f'listener')
    client.on_connect = on_connect
    client.connect(broker, port)
    return client

def subscribe(client, topic):
    def on_message(client, obj, msg):
        report = messages_pb2.TaskAssignment()
        report.ParseFromString(msg.payload)
        print(msg.topic+" "+str(report.Latitude))
        # print(msg.payload)

    client.subscribe(topic)
    client.on_message = on_message

def run():
    client = connect()
    subscribe(client, "test")
    client.loop_forever()

if __name__ == '__main__':
    run()

