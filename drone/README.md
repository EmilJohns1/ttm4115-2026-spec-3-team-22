# Drone Delivery

This git repository covers the drone and dock modules. The dock runs on the laptop hosting the broker, and will need all files except drone.py and the "drone"-folder. The drone runs on a Raspberry Pi + Sense HAT, and will need the drone.py file and the "drone"-folder.

For successful startup, order is important. Remember to modify broker IP address accordingly with used infrastructure. Below steps to run the IoT side of delivery system:

### Step 0
To run, the system needs a mosquitto broker running.
<br>URL for releases: https://mosquitto.org/download/
<br>Command to run: `mosquitto -v -c mosquitto.conf`

### Step 1
Run `python3 dock.py`

### Step 2
Add drones to fleet.
<br>To start the drone, run `python3 drone.py` on "drone" device.

## MQTT Topics

Topic structure utilized in the project:

```
.
└── delivery-system/
    ├── drone
    │   └── <droneID>
    │       ├── status
    │       ├── assignment
    │       ├── confirmation
    │       └── readiness
    └── management/
        ├── request
        ├── assignment
        └── failure
```
## Drone guide
To run the drone you will need a Raspberry Pi with a Sense HAT attachement. 
<br>Download either the whole repository or just the required drone.py file + "drone"-folder on to the Raspberry Pi.
<br>To run the drone you should navigate to the download location of the files and run `python3 drone.py` in the terminal.
<br>From there the drone will start up in 'idle' state; you will see the LED matrix light up, displaying the battery at the top and a compass underneath.
<br>Once the drone receives an assignment from the dock, the state will change and you will see the compass pointing somewhere. You can then use the joystick to navigate towards the location.
