from sensors import get_acceleration, get_direction, get_joystick
import math
import time

class Drone:
	def __init__(self):
		self.position = [0, 0] # simulated GPS
		self.velocity = [0, 0]
		self.state = "IDLE"
		self.battery = 100
		self.goal = None
		self.last_time = time.time()

	def set_goal(self, x, y):
		self.goal = [x, y]
		self.state = "DELIVERING"

	def distance_to_goal(self):
		if self.goal is None:
			return None

		dx = self.goal[0] - self.position[0]
		dy = self.goal[1] - self.position[1]

		return math.sqrt(dx**2 + dy**2)
	
	def check_arrival(self):
		distance = self.distance_to_goal()

		if distance is not None and distance < 0.5:
			if self.state == "DELIVERING":
				print("Arrived at destination!")
				self.set_goal(0, 0)
				self.state = "RETURNING"
				
			elif self.state == "RETURNING":
				print("Returned to dock!")
				self.state = "IDLE"
				self.goal = None

	def update_battery(self):
		if self.state == "DELIVERING" or self.state == "RETURNING":
			if self.battery > 0:
				self.battery -= 0.005
			if self.battery <= 0:
				self.battery = 0
		
		if self.state == "IDLE":
			self.battery += 0.02

	def get_speed(self):
		return 1.0
    
	def update_position(self):
		movement = get_joystick()

		step = 0.5 # movement per click

		for event in movement:
			if event.action == "pressed":
				if event.direction == "up":
					self.position[1] += step
				elif event.direction == "down":
					self.position[1] -= step
				elif event.direction == "right":
					self.position[0] += step
				elif event.direction == "left":
					self.position[0] -= step
	

	def update(self):
		if self.state == "DELIVERING" or self.state == "RETURNING":
			self.update_position()
			self.check_arrival()
		
		self.update_battery()

