from sensors import get_acceleration, get_direction
import math

class Drone:
	def __init__(self):
		self.position = [63.41606, 10.40722] # simulated GPS
		self.state = "DELIVERING"
		self.battery = 100

	def update_battery(self):
		if self.battery > 0:
			self.battery -= 0.25
		if self.battery <= 0:
			self.battery = 0

	def update_position(self):
		acceleration = get_acceleration()
		direction = get_direction()

		# convert compass values to radians
		theta = math.radians(direction)

		dx = acceleration['x']
		dy = acceleration['y']

		#print(acceleration)

		threshold = 0.05

    # threshold for noise
		if abs(dx) < threshold:
			dx = 0
		if abs(dy) < threshold:
			dy = 0

		x_pos = dx*math.cos(theta) - dy*math.sin(theta)
		y_pos = dx*math.sin(theta) + dy*math.cos(theta)

		scale = 0.01

		self.position[0] += x_pos*scale
		self.position[1] += y_pos*scale

	def update(self):
		self.update_position()
		self.update_battery()
