# Drone Delivery

This git repository covers the drone and dock modules. The dock runs on the laptop hosting the broker, and will need all files except drone.py and the "drone"-folder. The drone runs on a Raspberry Pi, and will need the drone.py file and the "drone"-folder.

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
