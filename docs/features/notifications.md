<!-- Read this when implementing or modifying push notifications -->

# Feature: Notifications

## Overview

Keeps customers informed about the progress of their drone deliveries via push notifications. Notifications are sent by the backend using the Expo Push API, which relays to FCM (Android) and APNs (iOS). Notifications are received on the device even when the app is closed.

**Status:** `planned`

---

## Behaviour spec

### Permission request

**Given** a user logs in for the first time,
**when** they reach the dashboard,
**then** the app requests push notification permission from the OS, obtains an Expo push token, and registers it with the backend.

### Order lifecycle notifications

The following notifications are sent automatically by the backend at each stage:

| Event            | Title             | Body                                                    |
| ---------------- | ----------------- | ------------------------------------------------------- |
| Order confirmed  | "Order confirmed" | "Your order is being prepared for dispatch."            |
| Drone dispatched | "On its way!"     | "Your drone has been dispatched and is heading to you." |
| Drone nearby     | "Almost there"    | "Your delivery is nearby. Get ready!"                   |
| Delivered        | "Delivered"       | "Your order has been delivered. Enjoy!"                 |

### Tapping a notification

**Given** a user receives a notification,
**when** they tap it,
**then** the app opens (or foregrounds) and navigates directly to the order tracking screen for that order.

### Edge cases

- **Permission denied** — do not ask again; the app functions normally without notifications
- **App in foreground** — show an in-app toast instead of a system notification
- **Stale notification** — if the user taps a notification for a completed order, navigate to the order detail screen rather than the tracking screen
- **Multiple active orders** — each notification must identify the specific order it relates to so the deep link goes to the correct tracking screen

### Out of scope

- Notification history / inbox screen — not required for demo
- User-configurable notification preferences — not required for demo
- Marketing or promotional notifications — not required for demo

---

## Data & API

### Models touched

- `User` — `expoPushToken`
- `Order` — `id`, `status`

### Endpoints used

| Method   | Path                   | Purpose                                            |
| -------- | ---------------------- | -------------------------------------------------- |
| `POST`   | `/users/me/push-token` | Register or update the Expo push token after login |
| `DELETE` | `/users/me/push-token` | Deregister the push token on logout                |

### Push notification flow

The frontend's responsibilities are limited to:

1. Requesting OS permission and obtaining an Expo push token via `expo-notifications`
2. Registering the token with the backend via `POST /users/me/push-token` after login
3. Deregistering the token via `DELETE /users/me/push-token` on logout
4. Handling incoming notifications and deep linking to the correct screen

The backend sends all notifications via the Expo Push API (`https://exp.host/--/api/v2/push/send`). The frontend never sends notifications.

---

## Constraints & hard rules

- Never send more than one notification per order lifecycle event — the backend must deduplicate
- The Expo push token must be refreshed and re-registered on every login in case it has changed
- The push token must be deregistered on logout — a logged-out user must not receive notifications
- Deep linking from a notification must work regardless of whether the app is in the foreground, background, or closed
- Each notification payload must include the `orderId` so the app can route to the correct screen
