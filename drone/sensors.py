from sense_hat import SenseHat

sense = SenseHat()

def get_acceleration():
	return sense.get_accelerometer_raw()

def get_direction():
	return sense.get_compass()
