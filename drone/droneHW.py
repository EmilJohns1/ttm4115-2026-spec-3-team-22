from drone.sensors import get_acceleration, get_direction, get_joystick
import math
import time
from threading import Thread
import messages_pb2 as mess

class DroneHW:
	def __init__(self):
		self.position = [6343350, 1040000] # simulated GPS
		self.velocity = [0, 0]
		self.state = "idle"
		self.battery = 100
		self.goal = None
		self.battery_full = True
		self.battery_last = True
		self.last_time = time.time()
		try:
			thread = Thread(target=self.update)
			thread.start()
		except KeyboardInterrupt:
			print("Interrupted")
			self.client.disconnect()

	def set_state(self, state):
		self.state = state

	def set_goal(self, x, y):
		self.goal = [x, y]
		self.state = "flight"

	def distance_to_goal(self):
		if self.goal is None:
			return None

		dx = self.goal[0] - self.position[0]
		dy = self.goal[1] - self.position[1]

		return math.sqrt(dx**2 + dy**2)
	
	def check_arrival(self):
		distance = self.distance_to_goal()

		if distance is not None and distance < 0.5:
			if self.state == "flight":
				print("Arrived at destination!")
				self.set_goal(0, 0)
				self.state = "return"
				
			elif self.state == "return":
				print("Returned to dock!")
				self.state = "idle"
				self.goal = None

	def update_battery(self):

		if self.state == "flight" or self.state == "return":
			self.battery_full = False
			self.battery_last = False
			if self.battery > 0:
				self.battery -= 0.005
			if self.battery <= 0:
				self.battery = 0
		
		if self.state == "idle":
			if self.battery < 100:
				self.battery += 0.02
			if self.battery >= 100:
				self.battery = 100
				self.battery_full = True

	def send_battery_status(self):
		battery_last = False
		if self.battery_full == True and self.battery_last == False:
			print(self.battery)
			payload = mess.DroneHello()
			payload.DroneID = self.DroneID
			payload.Battery = self.battery
			self.mqttclient.publish(f"delivery-system/drone/{self.DroneID}/readiness", payload.SerializeToString())
			self.battery_last = True

	def get_speed(self):
		return 1.0
    
	def update_position(self):
		movement = get_joystick()

		step = 1 # movement per click

		for event in movement:
			if event.action == "pressed" or event.action == "held":
				if event.direction == "up":
					self.position[1] += step
				elif event.direction == "down":
					self.position[1] -= step
				elif event.direction == "right":
					self.position[0] += step
				elif event.direction == "left":
					self.position[0] -= step
	

	def update(self):
		while True:
			self.update_position()
			self.check_arrival()
			self.update_battery()
			self.send_battery_status()
			time.sleep(0.1)

