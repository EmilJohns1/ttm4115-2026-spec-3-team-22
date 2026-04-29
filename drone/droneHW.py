from drone.sensors import get_acceleration, get_direction, get_joystick
import math
import time
from threading import Thread
import messages_pb2 as mess
from sense_hat import SenseHat

class DroneHW:
	def __init__(self):
		self.position = [6343350, 1040000] # simulated GPS
		self.velocity = [0, 0]
		self.state = "idle"
		self.battery = 100
		self.goal = [6343350, 1040000]
		self.battery_full = True
		self.battery_last = True
		self.last_time = time.time()
		self.sense = SenseHat()
		try:
			thread = Thread(target=self.update)
			thread.start()
		except KeyboardInterrupt:
			print("Interrupted")
			self.client.disconnect()

	def set_state(self, state):
		self.state = state

	def set_goal(self, x, y):
		self.goal = [int(x), int(y)]
		self.state = "flight"

	def distance_to_goal(self):
		if self.goal is None:
			return None

		dx = self.goal[0] - self.position[0]
		dy = self.goal[1] - self.position[1]

		return math.sqrt(dx**2 + dy**2)
	
	#def check_arrival(self):
		#distance = self.distance_to_goal()

		#if distance is not None and distance < 0.5:
		#	if self.state == "flight":
		#		print("Arrived at destination!")
		#		self.set_goal(0, 0)
		#		self.state = "return"
				
		#	elif self.state == "return":
		#		print("Returned to dock!")
		#		self.state = "idle"
		#		self.goal = None

	def update_battery(self):

		if self.state == "flight" or self.state == "return":
			self.battery_full = False
			self.battery_last = False
			if self.battery > 0:
				self.battery -= 0.01
			if self.battery <= 0:
				self.battery = 0
		
		if self.state == "idle":
			if self.battery < 100:
				self.battery += 0.05
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

	def display_battery(self):
		level = int((self.battery / 100) * 8)  # 0–8 columns

		green = (0, 255, 0)
		red = (255, 0, 0)
		off = (0, 0, 0)

    # choose color based on level
		color = green if self.battery > 30 else red

		pixels = []

		for y in range(8):
			for x in range(8):
						if x < level:
							pixels.append(color)
						else:
								pixels.append(off)
		self.sense.set_pixels(pixels)

	def get_goal_direction(self):
		dx = self.goal[0] - self.position[0]
		dy = self.goal[1] - self.position[1]

		angle = math.degrees(math.atan2(dy, dx))

		if angle < 0:
			angle += 360

		if angle < 22.5 or angle >= 337.5:
			return "E"
		elif angle < 67.5:
			return "NE"
		elif angle < 112.5:
			return "N"
		elif angle < 157.5:
			return "NW"
		elif angle < 202.5:
			return "W"
		elif angle < 247.5:
			return "SW"
		elif angle < 292.5:
			return "S"
		else:
			return "SE"
		
	arrows = {
		"N":  [(3,1),(3,2),(3,3),(2,2),(4,2)],
		"S":  [(3,6),(3,5),(3,4),(2,5),(4,5)],
		"E":  [(6,3),(5,3),(4,3),(5,2),(5,4)],
		"W":  [(1,3),(2,3),(3,3),(2,2),(2,4)],
		"NE": [(5,1),(4,2),(3,3)],
		"NW": [(2,1),(3,2),(4,3)],
		"SE": [(5,6),(4,5),(3,4)],
		"SW": [(2,6),(3,5),(4,4)],
	}

	def display_goal_direction(self):
		red = (255, 0, 0)
		green = (0, 255, 0)
		white = (255, 255, 255)
		off = (0, 0, 0)

		pixels = []

		# --- COMPASS ---
		center_x = 2
		center_y = 3

		dx = self.goal[0] - self.position[0]
		dy = self.goal[1] - self.position[1]
		distance = math.sqrt(dx**2 + dy**2)

		if distance < 1:
			compass_pixels = [(center_x, center_y, red)]
		else:
			angle = math.atan2(dy, dx)
			dir_x = round(math.cos(angle))
			dir_y = round(math.sin(angle))

			compass_pixels = [
				(center_x, center_y, white),
				(center_x + dir_x, center_y - dir_y, red),
				(center_x + 2*dir_x, center_y - 2*dir_y, red)
			]

		# --- BATTERY LEVEL ---
		battery_height = int((self.battery / 100) * 8)

		# --- BUILD SCREEN ---
		for y in range(8):
			for x in range(8):

				# BATTERY (right side)
				if x in [6, 7]:
					if y < battery_height:
						pixels.append(green)
					else:
						pixels.append(off)

				# GAP
				elif x == 5:
					pixels.append(off)

				# COMPASS
				else:
					drawn = False
					for (cx, cy, color) in compass_pixels:
						if x == cx and y == cy:
							pixels.append(color)
							drawn = True
							break

					if not drawn:
						pixels.append(off)

		self.sense.set_pixels(pixels)
	

	def update(self):
		while True:
			self.update_position()
			#self.check_arrival()
			self.update_battery()
			self.send_battery_status()
			#self.display_battery() 
			self.display_goal_direction()
			time.sleep(0.1)

