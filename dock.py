import paho.mqtt.client as mqtt
from threading import Thread
import random
import messages_pb2 as mess
from stmpy import Machine, Driver

broker = "localhost"
port = 1883
DockID = f'dock-{random.randint(0,1000)}'
fleet = []

# DroneID = f'drone-{5}'
# DroneID = f'drone-{random.randint(0, 100)}'

# my super scientific method of calculating battery levels
#    range of standard delivery drone:
#       28 km (without payload)
#       16 km (with payload 30 kg)


class MQTT_Dock:
    def __init__(self):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion(2), client_id=DockID)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def on_connect(self, client, userdata, flags, rc, properties):
        print("on_connect(): {}".format(mqtt.connack_string(rc)))

    def on_message(self, client, userdata, msg):
        print("on_message(): topic: {}".format(msg.topic))
        message = format(msg.topic).split("/")[-1]
        if message == "request":
            self.stm_driver.send("assignment_request", "dock") # NOT DRONE
        elif message == "readiness":
            payloadHello = mess.DroneHello()
            payloadHello.ParseFromString(msg.payload)
            fleet.append({payloadHello.DroneID: payloadHello.Battery})
            print("fleet:"+str(fleet))
        # elif message == "confirmation":
        #     self.stm_driver.send("arrival_confirmation", "drone")

    def start(self, broker, port):
        print("Connecting to {}:{}".format(broker, port))
        self.client.connect(broker, port)

        self.client.subscribe(f"delivery-system/drone/+/readiness")
        # self.client.subscribe(f"delivery-system/drone/{DroneID}/confirmation")

        try:
            thread = Thread(target=self.client.loop_forever)
            thread.start()
        except KeyboardInterrupt:
            print("Interrupted")
            self.client.disconnect()

class Dock:
    def on_idle(self):
        pass
        # fleet.append('drone-5') # available drones, for now hardcoded
        # do we want some function that checks availability of drones?

    def make_assignment(self):
        # TODO send request for battery levels
        # choose drone based on that and pass the assignment to it
        # send signal 'clear' to machine when done with assignment
        self.mqttclient.publish(f"delivery-system/drones/readiness","")

    def buffer_request(self):
        pass
        # TODO save the requests when busy
        # where to invoke buffered requests? maybe in make_assignment()

t0 = {
    "source": "initial",
    "target": "idle",
    "effect": "on_idle",
}

t1 = {
    "trigger": "assignment_request",  # from mqtt message
    "source": "idle",
    "target": "assignment_making",
    "effect": "make_assignment",
}

t1_buffer = {
    "trigger": "assignment_request",
    "source": "assignment_making",
    "target": "assignment_making",
    "effect": "buffer_request",
}

t2 = {
    "trigger": "clear",
    "source": "assignment_making",
    "target": "idle",
    "effect": "on_idle",
}


def start_machine():
    dock = Dock()
    dock_machine = Machine(transitions=[t0, t1, t1_buffer, t2], obj=dock, name="dock")
    dock.stm = dock_machine

    driver = Driver()
    driver.add_machine(dock_machine)

    myclient = MQTT_Dock()
    dock.mqttclient = myclient.client
    myclient.stm_driver = driver

    driver.start()
    myclient.start(broker, port)


if __name__ == '__main__':
    start_machine()