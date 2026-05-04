from droneHW import DroneHW
import time

drone = DroneHW()
drone.set_goal(5, 5)

last_print = time.time()

while True:
	drone.update()

	# print every 1 second
	if time.time() - last_print >= 1:
		print(f"POS: ({drone.position[0]:.1f}, {drone.position[1]:.1f}) | BATTERY: {drone.battery:.1f} | STATE: {drone.state}")
		last_print = time.time()

	time.sleep(0.05)  # update loop