# ttm4115-2026-spec-3-team-22 - Drone Delivery System
A drone delivery system developed as a course project for TTM4115 (Design of Communicating Systems) at NTNU. The system allows users to order products through a mobile application and have them delivered by a drone. Communication between the application, backend, and drone hardware is coordinated through a combination of MQTT messages and HTTP requests.
## System overview
The system consists of following components:

| Component      | Technology                          | Role                                                                 |
|----------------|-------------------------------------|----------------------------------------------------------------------|
| Mobile app     | React Native / Expo                 | User-facing interface for browsing products, placing orders, and tracking deliveries |
| Backend API    | FastAPI (Python)                    | REST API, order management, payment processing, and drone coordination |
| MQTT broker    | Eclipse Mosquitto                  | Message broker mediating all communication between the backend, dock, and drone |
| Dock           | Python (stmpy)                      | Manages the drone fleet and assigns delivery tasks                   |
| Drone          | Python + Sense HAT (Raspberry Pi)   | Executes delivery flights and reports position and status            |

Payments are handled by Stripe, and push notifications by Expo's push notification service

Another thing worth noting is that the backend repository should populate the database with a test user with credentials: username: alice@example.com, password: password123.
## Environement variables
Make sure to look through all the projects and see which environment variables are needed. Since we provide this as a public repository, we should not include these. If you are an examiner and need these, please try reaching out to the repository contributors or set them up yourself. It requires setting up a Stripe project and local webhook forwarder for STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, and a Firebase project for GOOGLE_APPLICATION_CREDENTIALS.

## Backend & Drone Dock
To run the backend and the drone dock, you simply need to use Docker Compose from the root directory:

(make sure to create a .env file in both directories)

```bash
docker compose up --build
```

## Drone
The drone runs on a Raspberry Pi with a Sense HAT. The host of the broker's ip address must be specified in the .env file: 

```bash
BROKER_HOST_IP="xx.xx.xxx.xxx"
```

To run the drone, simply execute this command on the Raspberry Pi: 

```bash
python drone.py
```

## Frontend
The frontend requires a manual setup. 

### 1. Install dependencies
Navigate to the `frontend` directory and install the necessary dependencies:

```bash
cd frontend
npm install
```

### 2. Start the app
The app utilizes some native modules and must therefore be run as a development build. 
- A Mac or another device with access to Xcode must compile the app in order to launch it on an iOS device. 
- The easiest approach is running it through an Android Simulator. This can be set up by downloading Android Studio, this however does not work with notifications. Throughout development the app has been tested on a physical Android device, and thus this has the best stability.

To start the app, run:
```bash
npx expo run:android 
# or
npx expo run:ios
```

## Repository Structure
```
.
├── backend/                  # FastAPI REST API
│   ├── app/
│   │   ├── main.py           # Application entrypoint and lifespan hooks
│   │   ├── auth.py           # JWT authentication setup
│   │   ├── notifications.py  # Expo push notification integration
│   │   ├── db/
│   │   │   ├── models.py     # SQLAlchemy database models
│   │   │   ├── base.py       # Database engine and session setup
│   │   │   ├── deps.py       # Dependency injection (get_db)
│   │   │   └── seed.py       # Sample product seeding on startup
│   │   ├── mqtt/
│   │   │   ├── mqtt_client.py    # MQTT subscriber and message handlers
│   │   │   ├── messages.proto    # Protobuf message schema
│   │   │   └── messages_pb2.py   # Compiled Protobuf definitions
│   │   ├── routers/
│   │   │   ├── users.py      # User profile endpoints
│   │   │   ├── products.py   # Product catalogue endpoints
│   │   │   ├── orders.py     # Order and tracking endpoints
│   │   │   ├── drones.py     # Drone telemetry endpoints
│   │   │   └── payment.py    # Stripe payment and webhook endpoints
│   │   └── schemas/          # Pydantic request/response schemas
│   ├── tests/                # Pytest test suite
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── drone/                    # Dock and drone programs
│   ├── dock.py               # Dock: fleet management and drone assignment (stmpy FSM)
│   ├── drone.py              # Drone entrypoint: MQTT client and state machine
│   ├── drone/                # Drone hardware abstraction package (Raspberry Pi)
│   │   ├── droneHW.py        # Sense HAT driver: position, battery, LED display
│   │   └── sensors.py        # Accelerometer, joystick, and direction sensor wrappers
│   ├── messages.proto        # Protobuf message schema (shared with backend)
│   ├── messages_pb2.py       # Compiled Protobuf definitions
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                 # React Native / Expo mobile application
│   ├── app/                  # File-based routes (Expo Router)
│   ├── components/           # Shared UI components
│   ├── services/             # API service layer (orders, auth, payments, etc.)
│   ├── hooks/                # Custom React hooks
│   ├── context/              # React context providers
│   ├── utils/                # API client setup and token handling
│   ├── constants/            # Environment config and constants
│   └── assets/               # Images and fonts
│
├── docker-compose.yml        # Orchestrates broker, backend, and dock containers
└── README.md
```
