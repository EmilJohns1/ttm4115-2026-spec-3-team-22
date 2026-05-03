import paho.mqtt.client as mqtt
from threading import Thread
import random
import messages_pb2 as mess
from stmpy import Machine, Driver
from drone.droneHW import DroneHW

broker = "10.94.214.190"
port = 1883
batteryLevel = 100 # upon start drone fully charged
DroneID = f'drone-{random.randint(0, 100)}'
currentOrderID = '0'
# Dock address
baseLatitude = 6343350
baseLongitude = 1040000

class MQTT_Drone:
    def __init__(self):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion(2), client_id=DroneID)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def on_connect(self, client, userdata, flags, rc, properties):
        print("on_connect(): {}".format(mqtt.connack_string(rc)))
        self.stm_driver.start(keep_active=True)

    def on_message(self, client, userdata, msg):
        print("on_message(): topic: {}".format(msg.topic))
        message = format(msg.topic).split("/")[-1]
        if message == "assignment":
            report = mess.TaskAssignment()
            report.ParseFromString(msg.payload)
            global currentOrderID
            currentOrderID = report.OrderID
            self.stm_driver.send("task_assignment", "drone", args=[report.Latitude, report.Longitude])

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
        global currentOrderID
        currentOrderID = '0'
        payload = mess.DroneHello()
        payload.DroneID = DroneID
        payload.Battery = self.droneHW.battery
        self.droneHW.set_state("idle")
        self.mqttclient.publish(f"delivery-system/drone/{DroneID}/readiness", payload.SerializeToString())

    def update_goal(self, Latitude, Longitude):
        self.goalLatitude = Latitude
        self.goalLongitude = Longitude
        self.droneHW.set_state("flight")
        self.droneHW.set_goal(self.goalLatitude, self.goalLongitude)
        print(self.goalLatitude)
        print(self.goalLongitude)
        return 'flight'

    def send_status(self):
        status = mess.Status()
        status.Date = 1234567
        status.Battery_level = self.droneHW.battery
        status.Latitude = self.droneHW.position[0]
        status.Longitude = self.droneHW.position[1]
        status.Speed = 54 # 15 m/s
        print(status)
        self.mqttclient.publish(f"delivery-system/drone/{DroneID}/status", status.SerializeToString()) # test message
        if status.Latitude == self.goalLatitude and status.Longitude == self.goalLongitude:
            print("success")
            confirm = mess.ArrivalConfirmation()
            confirm.DroneID = DroneID
            confirm.OrderID = currentOrderID
            self.goalLatitude = baseLatitude
            self.goalLongitude = baseLongitude
            self.droneHW.set_goal(self.goalLatitude, self.goalLongitude)
            self.mqttclient.publish(f"delivery-system/drone/{DroneID}/confirmation", confirm.SerializeToString())
            self.stm_driver.send("landing", "drone")

    def send_status_on_return(self):
        status = mess.Status()
        status.Date = 1234567
        status.Battery_level = self.droneHW.battery
        status.Latitude = self.droneHW.position[0]
        status.Longitude = self.droneHW.position[1]
        status.Speed = 54 # 15 m/s
        print(status)
        self.mqttclient.publish(f"delivery-system/drone/{DroneID}/status", status.SerializeToString()) # test message
        if status.Latitude == self.goalLatitude and status.Longitude == self.goalLongitude:
            self.stm_driver.send("landing", "drone")

t0 = {
    "source": "initial",
    "target": "idle",
    "effect": "on_idle",
}

t1 = {
    "trigger": "task_assignment",  # from mqtt message
    "source": "idle",
    "target": "flight",
    "effect": "update_goal(*)", # 2000 is assumption about X
}

flight = {
    "name": "flight",
    "entry": "start_timer('t', 2000)"
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
    "target": "return",
    "effect": "start_timer('t', 2000)",
}

t2_update = {
    "trigger": "t",
    "source": "return",
    "target": "return",
    "effect": "send_status_on_return; start_timer('t', 2000)",
}

t3 = {
    "trigger": "landing", # also needs to be a trigger to driver coming from sensor
    "source": "return",
    "target": "idle",
    "effect": "on_idle",
}

t4 = {
    "trigger": "t",
    "source": "idle",
    "target": "idle",
}

def start_machine():
    droneHW = DroneHW()
    drone = Drone()
    drone_machine = Machine(transitions=[t0, t1, t1_update, t2, t2_update, t3], states=[flight], obj=drone, name="drone")
    drone.stm = drone_machine

    driver = Driver()
    driver.add_machine(drone_machine)

    myclient = MQTT_Drone()
    drone.mqttclient = myclient.client
    myclient.stm_driver = driver
    drone.stm_driver = driver

    drone.droneHW = droneHW
    droneHW.mqttclient = myclient.client
    droneHW.DroneID = DroneID

    # driver.start(keep_active=True)    # started in MQTT_Drone._on_connect() to prevent race condition
    myclient.start(broker, port)


if __name__ == '__main__':
    start_machine()