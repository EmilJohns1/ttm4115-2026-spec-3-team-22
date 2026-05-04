# Backend handoff

This document translates app screens into backend requirements.

Use this file for implementation sequencing and to verify that each screen receives the exact data shape it needs.

For canonical payload definitions, see `api-spec.md`.

---

## 1. Screen-by-screen endpoint contract

| Screen / Route                                         | Primary user actions                                   | Data sent from app                                        | Data expected by app                                             | Endpoint(s)                                                       |
| ------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| Login (`app/auth/login.tsx`)                           | Submit credentials, continue with Google, auto refresh | Email/password OR Google idToken OR refreshToken          | accessToken, refreshToken, user summary                          | `POST /auth/login`, `POST /auth/google`, `POST /auth/refresh`     |
| Register (`app/auth/register.tsx`)                     | Create account                                         | name, email, password, deliveryAddress                    | accessToken, refreshToken, user summary                          | `POST /auth/register`                                             |
| Home dashboard (`app/(tabs)/index.tsx`)                | Load active and recent orders                          | limit query for recent list                               | active order cards and up to 3 recent deliveries                 | `GET /orders/active`, `GET /orders/recent?limit=3`                |
| Browse products (`app/(tabs)/browse.tsx`)              | Search, filter, scroll                                 | search/category/cursor/limit query params                 | paginated product cards with availability                        | `GET /products`                                                   |
| Product details (`app/products/[productId]/index.tsx`) | Open single product details                            | productId in path                                         | full product details including available flag                    | `GET /products/:id`                                               |
| Checkout (`app/products/[productId]/checkout.tsx`)     | Submit delivery address and pay                        | productId + per-order deliveryAddress, idempotency header | pending order + Stripe payment intent data + confirmation status | `POST /orders`, `POST /payments/intent`, `POST /payments/confirm` |
| Orders list (`app/(tabs)/orders.tsx`)                  | Switch Active/Completed/Cancelled tabs                 | status/cursor/limit query params                          | paginated order list by section                                  | `GET /orders?status=&cursor=&limit=`                              |
| Order tracking (`app/orders/[orderId].tsx`)            | Open tracking, poll while visible                      | orderId path param                                        | status, statusLabel, drone coordinates, destination coordinates  | `GET /orders/:id`, `GET /orders/:id/tracking`                     |
| Profile view/edit (`app/(tabs)/profile.tsx`)           | View profile, edit profile fields                      | patch body with changed profile fields                    | full updated profile object                                      | `GET /users/me`, `PATCH /users/me`                                |
| Change password                                        | Submit old + new password                              | currentPassword + newPassword                             | success flag                                                     | `PATCH /users/me/password`                                        |
| Payment method management                              | Load card summary and start card setup                 | returnUrl for Stripe setup flow                           | existing card summary OR SetupIntent client secret               | `GET /users/me/payment-method`, `POST /users/me/payment-method`   |
| Notification registration                              | Register and remove Expo push token                    | expoPushToken + platform (+ deviceId)                     | success flag                                                     | `POST /users/me/push-token`, `DELETE /users/me/push-token`        |
| Logout                                                 | Deregister push token and end session                  | expoPushToken + refreshToken                              | success flags                                                    | `DELETE /users/me/push-token`, `POST /auth/logout`                |

---

## 2. Delivery-critical flows

### A. Authentication flow

1. App calls login/register/google endpoint.
2. Backend returns access + refresh token pair.
3. App stores tokens and fetches profile/personalized data.
4. On token expiry, app calls refresh once and retries failed request.

Backend requirement:

- Refresh endpoint must be stable and low-latency because every protected screen depends on it.

### B. Place order + payment flow

1. App calls `POST /orders` with product and per-order address.
2. Backend creates `pending` order.
3. App calls `POST /payments/intent` to fetch Stripe payment intent data.
4. App confirms payment in Stripe sheet using returned client secret.
5. App calls `POST /payments/confirm` to validate payment.
6. Backend transitions order to `confirmed`, then dispatches drone command.

Backend requirement:

- `POST /orders` must be idempotent to prevent duplicate pending orders on retries.
- `POST /payments/intent` should reuse the same PaymentIntent on retries.

### C. Tracking flow

1. User opens tracking screen.
2. App polls `GET /orders/:id/tracking` every 5 seconds while screen is mounted.
3. Backend returns latest transformed telemetry snapshot.
4. App stops polling when status is terminal.

Backend requirement:

- Telemetry ingestion and tracking read model must be optimized for frequent reads.

### D. Push notification flow

1. After login, app registers Expo push token.
2. Backend stores token linked to user/device.
3. Lifecycle events trigger backend push dispatch (`confirmed`, `dispatched`, `nearby`, `delivered`).
4. App uses `orderId` in payload to deep-link to tracking/order details.
5. On logout, app deregisters token.

Backend requirement:

- Deduplicate notifications so each lifecycle event is sent once per order.

---

## 3. UI behavior dependencies the backend must satisfy

- Order statuses must remain consistent with these buckets:
  - Active: `confirmed`, `dispatched`, `in_transit`
  - Terminal: `delivered`, `cancelled`
- Tracking endpoint must return destination coordinates and optionally drone coordinates.
- For no telemetry yet, return `drone: null` (not an error).
- Out-of-stock products must be returned with `available: false`.
- Orders tab needs efficient status filtering and cursor pagination.
- Profile editing only updates saved user profile; checkout address must not overwrite saved profile address.

---

## 4. Error handling contract expected by app

- `400 VALIDATION_ERROR`: field-level errors for forms
- `401 UNAUTHORIZED`: refresh flow trigger
- `404 NOT_FOUND`: missing product/order fallback states
- `409 OUT_OF_STOCK`: block checkout and show unavailable state
- `402/409 PAYMENT_FAILED`: stay on checkout and allow retry
- `500+`: generic toast + retry behavior

All errors should use the common envelope from `api-spec.md`.

---

## 5. Suggested backend implementation order

1. Auth endpoints + token refresh
2. Product list/detail endpoints
3. Create-order endpoint + payments intent/confirm
4. Orders list/dashboard endpoints
5. Tracking endpoint + telemetry ingestion
6. Profile + password + payment method endpoints
7. Push token registration + notification dispatch

---

## 6. Open decisions that should be finalized early

- Auth stack: BetterAuth vs managed provider
- Final address format in DB/API
- Stripe customer creation timing
- Telemetry persistence strategy (latest-only vs full history)
- Production/staging base URLs
