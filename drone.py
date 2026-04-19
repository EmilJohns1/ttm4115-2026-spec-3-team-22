import paho.mqtt.client as mqtt
from threading import Thread
import random

from scapy.contrib.mount import NULL_Call
from stmpy import Machine, Driver

broker = "localhost"
port = 1883
DroneID = f'drone-{random.randint(0, 100)}'

class MQTT_Drone:
    def __init__(self):
        self.count = 0  # useless for now
        self.client = None
        # print(self.count)

    def on_connect(self, client, userdata, flags, rc, properties):
        print("on_connect(): {}".format(mqtt.connack_string(rc)))

    def on_message(self, client, userdata, msg):
        print("on_message(): topic: {}".format(msg.topic))
        # self.count = self.count + 1
        # if self.count == 20:
        #     self.client.disconnect()
        #     print("disconnected after 20 messages")

    def start(self, broker, port):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion(2), client_id=DroneID)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        print("Connecting to {}:{}".format(broker, port))
        self.client.connect(broker, port)

        self.client.subscribe("test")
        try:
            thread = Thread(target=self.client.loop_forever)
            thread.start()
        except KeyboardInterrupt:
            print("Interrupted")
            self.client.disconnect()

class Drone:
    def __init__(self):
        self.mqttclient = None

    def on_idle(self):
        self.goalLatitude = 0
        self.goalLongitude = 0

    def send_status(self):
        # TODO: send statuses and... fly? xd
        self.mqttclient.publish("test", "highUpInTheSky") # test message
        pass

t0 = {
    "source": "initial",
    "target": "idle",
    "effect": "on_idle",
}

t1 = {
    "trigger": "task_assignment",   # needs to be a trigger to driver coming from mqtt message
    "source": "idle",
    "target": "flight",
    "effect": "start_timer('flight', 20)", # 20 is assumption about X
}

t1_update = {
    "trigger": "t",
    "source": "flight",
    "target": "flight",
    "effect": "send_status; start_timer('t', 20)",
}

t2 = {
    "trigger": "landing", # needs to be a trigger to driver coming from sensor
    "source": "flight",
    "target": "idle",
    "effect": "on_idle",
}

# up to discussion: do we need 'return' state? or will second usage of 'flight' suffice?
t3 = {
    "trigger": "arrival_confirmation",
    "source": "idle",
    "target": "return",
    "effect": "start_timer('t', 20)",
}

t3_update = {
    "trigger": "t",
    "source": "return",
    "target": "return",
    "effect": "send_status; start_timer('t', 20)",
}

t4 = {
    "trigger": "landing", # also needs to be a trigger to driver coming from sensor
    "source": "return",
    "target": "idle",
    "effect": "on_idle",
}

def start_machine():
    drone = Drone()
    drone_machine = Machine(transitions=[t0, t1, t1_update, t2, t3, t3_update, t4], obj=drone, name="drone")
    drone.stm = drone_machine

    driver = Driver()
    driver.add_machine(drone_machine)

    myclient = MQTT_Drone()
    drone.mqttclient = myclient.client
    myclient.stm_driver = driver

    driver.start()
    myclient.start(broker, port)


if __name__ == '__main__':
    # myclient = MQTT_Drone()
    # myclient.start(broker, port)
    start_machine()