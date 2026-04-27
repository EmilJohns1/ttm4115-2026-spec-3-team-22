import paho.mqtt.client as mqtt
from threading import Thread
import random
import messages_pb2 as mess
from stmpy import Machine, Driver
from drone.droneHW import DroneHW

broker = "10.132.63.190"
port = 1883
batteryLevel = 100 # upon start drone fully charged
DroneID = f'drone-{random.randint(0, 100)}'
currentOrderID = '0'
# Dock address
baseLatitude = 63.4335
baseLongitude = 10.4

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
            self.stm_driver.send("task_assignment", "drone", args=[str(report.Latitude), str(report.Longitude)])
        # elif message == "confirmation":
        #     self.stm_driver.send("arrival_confirmation", "drone")
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
    #def __init__(self):
        #droneHW = DroneHW()

    def on_idle(self):
        self.goalLatitude = 0
        self.goalLongitude = 0
        global currentOrderID
        currentOrderID = '0'
        # self.batteryLevel = 100
        payload = mess.DroneHello()
        payload.DroneID = DroneID
        payload.Battery = batteryLevel
        self.mqttclient.publish(f"delivery-system/drone/{DroneID}/readiness", payload.SerializeToString())

    def update_goal(self, Latitude, Longitude):
        self.goalLatitude = Latitude
        self.goalLongitude = Longitude
        print(self.goalLatitude)
        print(self.goalLongitude)
        return 'flight'

    def send_status(self):
        # TODO: pass status data from sensors
        
        status = mess.Status()
        status.Date = 1234567
        status.Battery_level = self.droneHW.battery
        status.Latitude = self.droneHW.position[0]
        status.Longitude = self.droneHW.position[1]
        status.Speed = 54 # 15 m/s
        print(status)
        self.mqttclient.publish(f"delivery-system/drone/{DroneID}/status", status.SerializeToString()) # test message
        if status.Latitude == self.goalLatitude and status.Longitude == self.goalLongitude:
            confirm = mess.ArrivalConfirmation()
            confirm.DroneID = DroneID
            confirm.OrderID = currentOrderID
            self.goalLatitude = baseLatitude
            self.goalLongitude = baseLongitude
            self.mqttclient.publish(f"delivery-system/drone/{DroneID}/confirmation", status.SerializeToString())
            self.stm_driver.send("landing", "drone")

    def send_status_on_return(self):
        # TODO: pass status data from sensors
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

def start_machine():
    drone = Drone()
    drone_machine = Machine(transitions=[t0, t1, t1_update, t2, t2_update, t3], states=[flight], obj=drone, name="drone")
    drone.stm = drone_machine

    driver = Driver()
    driver.add_machine(drone_machine)

    myclient = MQTT_Drone()
    drone.mqttclient = myclient.client
    myclient.stm_driver = driver
    drone.stm_driver = driver

    droneHW = DroneHW()
    drone.droneHW = droneHW

    # driver.start(keep_active=True)    # started in MQTT_Drone._on_connect() to prevent race condition
    myclient.start(broker, port)


if __name__ == '__main__':
    start_machine()