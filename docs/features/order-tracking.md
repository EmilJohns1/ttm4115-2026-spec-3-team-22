<!-- Read this when implementing or modifying the order tracking screen or drone position polling -->

# Feature: Order tracking

## Overview

Allows a customer to follow their drone delivery in real time on a map. The app polls the backend for the drone's current GPS position while the tracking screen is open. Uses Google Maps on Android and Apple Maps on iOS via `react-native-maps`. Accessible from the dashboard and via push notification deep links.

**Status:** `planned`

---

## Behaviour spec

### Viewing the tracking screen

**Given** a user taps an active order on the dashboard,
**when** the tracking screen loads,
**then** a map is displayed showing the drone's current position marker and the delivery destination marker.

### Live position updates

**Given** a user is on the tracking screen,
**when** the screen is open,
**then** the app polls `GET /orders/:id/tracking` every 5 seconds and updates the drone marker position on the map.

### Order status banner

**Given** a user is on the tracking screen,
**then** a status banner at the top of the screen shows the current order status (e.g. "Drone dispatched", "On its way", "Almost there").

### Delivery complete

**Given** the order status changes to `delivered`,
**when** the tracking screen receives this status from a poll response,
**then** polling stops, the status banner updates to "Delivered!", and a prompt appears to return to the dashboard.

### Edge cases

- **Polling error** — silently retry on the next interval. Show a toast only after three consecutive failures: "Having trouble updating your tracking. Check your connection."
- **No GPS data yet** — show a placeholder on the map: "Waiting for drone position..." and continue polling
- **User leaves screen** — polling stops immediately on unmount
- **Deep link to completed order** — show the final delivery position with the "Delivered" state; do not poll

### Out of scope

- Flight path or route visualisation — not required for demo
- ETA countdown — not required for demo
- Drone altitude display — not shown in the UI; backend only
- Drone camera feed — not required for demo

---

## Data & API

### Models touched

- `Order` — `id`, `status`
- `DronePosition` — `latitude`, `longitude`, `updatedAt`

### Endpoints used

| Method | Path                   | Purpose                                             |
| ------ | ---------------------- | --------------------------------------------------- |
| `GET`  | `/orders/:id/tracking` | Returns current order status and drone GPS position |

### Example response

```json
{
  "data": {
    "orderId": "abc123",
    "status": "in_transit",
    "drone": {
      "latitude": 63.4305,
      "longitude": 10.3951,
      "updatedAt": "2025-01-01T12:00:00Z"
    },
    "destination": {
      "latitude": 63.435,
      "longitude": 10.4
    }
  }
}
```

---

## Constraints & hard rules

- Polling starts on screen mount and stops immediately on unmount — no background polling
- Do not poll for orders with a terminal status (`delivered`, `cancelled`)
- Use `react-native-maps` — it uses Google Maps on Android and Apple Maps on iOS by default with no extra configuration
- Drone position updates come from the backend only — the frontend never receives MQTT data directly
- Altitude must never be displayed in the UI

---

## Open questions

- [ ] **Poll interval vs telemetry frequency** — 5 seconds is assumed; confirm based on how frequently the IoT gateway publishes drone position updates to the backend
