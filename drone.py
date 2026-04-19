import paho.mqtt.client as mqtt
from threading import Thread
import random
import messages_pb2 as mess
from stmpy import Machine, Driver

broker = "localhost"
port = 1883
DroneID = f'drone-{random.randint(0, 100)}'

class MQTT_Drone:
    def __init__(self):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion(2), client_id=DroneID)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def on_connect(self, client, userdata, flags, rc, properties):
        print("on_connect(): {}".format(mqtt.connack_string(rc)))

    def on_message(self, client, userdata, msg):
        print("on_message(): topic: {}".format(msg.topic))
        message = format(msg.topic).split("/")[-1]
        if message == "assignment":
            self.stm_driver.send("task_assignment", "drone")
        elif message == "confirmation":
            self.stm_driver.send("arrival_confirmation", "drone")
        # self.count = self.count + 1
        # if self.count == 20:
        #     self.client.disconnect()
        #     print("disconnected after 20 messages")

    def start(self, broker, port):
        print("Connecting to {}:{}".format(broker, port))
        self.client.connect(broker, port)

        self.client.subscribe(f"delivery-system/drone/{DroneID}/assignment")
        self.client.subscribe(f"delivery-system/drone/{DroneID}/confirmation")

        try:
            thread = Thread(target=self.client.loop_forever)
            thread.start()
        except KeyboardInterrupt:
            print("Interrupted")
            self.client.disconnect()

class Drone:
    def on_idle(self):
        self.goalLatitude = 0
        self.goalLongitude = 0

    def send_status(self):
        # TODO: pass status data from sensors
        status = mess.Status()
        status.Date = 1234567
        status.Battery_level = 74
        status.Latitude = 17.456782
        status.Longitude = -19.2317
        status.Speed = 58.47
        print(status)
        self.mqttclient.publish(f"delivery-system/drone/{DroneID}/status", status.SerializeToString()) # test message
        # pass

t0 = {
    "source": "initial",
    "target": "idle",
    "effect": "on_idle",
}

t1 = {
    "trigger": "task_assignment",  # from mqtt message
    "source": "idle",
    "target": "flight",
    "effect": "start_timer('t', 2000)", # 2000 is assumption about X
}

t1_update = {
    "trigger": "t",
    "source": "flight",
    "target": "flight",
    "effect": "send_status; start_timer('t', 2000)",
}

t2 = {
    "trigger": "landing", # needs to be a trigger to driver coming from sensor
    "source": "flight",
    "target": "idle",
    "effect": "on_idle",
}

# up to discussion: do we need 'return' state? or will second usage of 'flight' suffice?
t3 = {
    "trigger": "arrival_confirmation",   # from mqtt message
    "source": "idle",
    "target": "return",
    "effect": "start_timer('t', 2000)",
}

t3_update = {
    "trigger": "t",
    "source": "return",
    "target": "return",
    "effect": "send_status; start_timer('t', 2000)",
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
    start_machine()