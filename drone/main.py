from drone import Drone
import time

drone = Drone()

while True:
	drone.update()

	print(f"POS: {drone.position} - BATTERY: {drone.battery:.1f}")

	time.sleep(1)
