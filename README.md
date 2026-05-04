# ttm4115-2026-spec-3-team-22

## Backend & Drone
To run the backend and the drone, you simply need to use Docker Compose from the root directory:
(make sure to create a .env file in both directories)

```bash
docker compose up --build
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
- The easiest approach is running it through an Android Simulator. This can be set up by downloading Android Studio.

To start the app, run:
```bash
npx expo run:android 
# or
npx expo run:ios
```