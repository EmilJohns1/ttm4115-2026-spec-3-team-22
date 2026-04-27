import paho.mqtt.client as mqtt
from threading import Thread
import random
import messages_pb2 as mess
from stmpy import Machine, Driver
from math import cos, asin, sqrt, pi

broker = "localhost"
port = 1883
DockID = f'dock-{random.randint(0,1000)}'
fleet = []
assignments = []  # this is sorta dangerous cuz in theory there exists a possibility of popping and appending data at the same time by diff threads. Im choosing to be whimsical and ignore it for now
baseLatitude = 17.456782
baseLongitude = -19.2317

# my super scientific method of calculating battery levels
#    range of standard delivery drone:
#       28 km (without payload)
#       16 km (with payload 30 kg)

def distance(lat1, lon1, lat2, lon2):
    r = 6371 # km
    p = pi / 180
    a = 0.5 - cos((lat2-lat1)*p)/2 + cos(lat1*p) * cos(lat2*p) * (1-cos((lon2-lon1)*p))/2
    return 2 * r * asin(sqrt(a))

def flight_time(payload_weight):
    return 38 - 10 ** ((payload_weight - 1) / 17)

def required_battery(dis):
    # drone flies avg 15 m/s = 54 km/h
    # with 2kg payload it can fly for circa 27 minutes
    #   ergo it uses 3.7% of battery per minute of flight
    time_min = 60 * dis / 54
    return time_min*3.7

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
            payloadLocation = mess.AssignmentRequest()
            payloadLocation.ParseFromString(msg.payload)
            assignments.append({"orderID": payloadLocation.OrderID, "lat": payloadLocation.Latitude, "long": payloadLocation.Longitude})
            self.stm_driver.send("assignment_request", "dock")
        elif message == "readiness":
            payloadHello = mess.DroneHello()
            payloadHello.ParseFromString(msg.payload)
            fleet.append({"droneID": payloadHello.DroneID, "battery": payloadHello.Battery})
            print("fleet:"+str(fleet))
            if assignments:
                self.stm_driver.send("assignment_request", "dock")

    def start(self, broker, port):
        print("Connecting to {}:{}".format(broker, port))
        self.client.connect(broker, port)

        self.client.subscribe(f"delivery-system/drone/+/readiness")
        self.client.subscribe(f"delivery-system/management/request")

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
        # choose drone based on battery and pass the assignment to it
        # fleet is LIFO so choice should be fair, verif of battery is a formality
        temp = assignments
        for assignment in temp:
            if not fleet:
                print("Fleet is empty")
                message = mess.AssignmentFailed()
                message.OrderID = assignment["orderID"]
                message.ErrCode = 503  # HTTP Service Unavailable hihi
                assignments[:] = [a for a in assignments if a != assignment]
                self.mqttclient.publish(f"delivery-system/management/failure", message.SerializeToString())
                pass
            latitude = assignment["lat"]
            longitude = assignment["long"]
            minimum_battery = required_battery(distance(latitude, longitude, baseLatitude, baseLongitude)) + 8
            if minimum_battery > 100:
                message = mess.AssignmentFailed()
                message.OrderID = assignment["orderID"]
                message.ErrCode = 413 # HTTP Content Too Large hihi
                assignments[:] = [a for a in assignments if a != assignment]
                self.mqttclient.publish(f"delivery-system/management/failure", message.SerializeToString())
                pass
            for drone in fleet:
                if drone["battery"] > minimum_battery:
                    message = mess.DroneAssignment()
                    message.OrderID = assignment["orderID"]
                    message.DroneID = drone["droneID"]
                    message.Latitude = latitude
                    message.Longitude = longitude
                    fleet[:] = [d for d in fleet if d["droneID"] != drone["droneID"]]
                    assignments[:] = [a for a in assignments if a != assignment]
                    print("fleet:" + str(fleet))
                    print("assignment made: {} {} {}".format(drone["droneID"], latitude, longitude))
                    self.mqttclient.publish(f"delivery-system/management/assignment", message.SerializeToString())
                    pass
        self.stm_driver.send("clear", "dock")

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

t2 = {
    "trigger": "clear",
    "source": "assignment_making",
    "target": "idle",
    "effect": "on_idle",
}

def start_machine():
    dock = Dock()
    dock_machine = Machine(transitions=[t0, t1, t2],obj=dock, name="dock")
    dock.stm = dock_machine

    driver = Driver()
    driver.add_machine(dock_machine)

    myclient = MQTT_Dock()
    dock.mqttclient = myclient.client
    myclient.stm_driver = driver
    dock.stm_driver = driver

    driver.start()
    myclient.start(broker, port)


if __name__ == '__main__':
    start_machine()