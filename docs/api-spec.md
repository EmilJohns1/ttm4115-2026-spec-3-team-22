# API spec

This document is the backend contract for the mobile app.

Use this file as the source of truth for:

- endpoint paths and methods
- request payloads sent from the app
- response payloads expected by the app
- status/error handling behavior

For screen-by-screen context, see `docs/backend-handoff.md`.

---

## Environments

| Environment | Base URL                    |
| ----------- | --------------------------- |
| Development | `http://localhost:3000/api` |
| Staging     | TODO                        |
| Production  | TODO                        |

---

## Authentication

- All endpoints require Bearer auth unless marked `Public`
- Public endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `POST /auth/refresh`
- Access token expiry target: 24 hours
- On first `401`: app calls `POST /auth/refresh`, then retries original request once
- On second `401`: app logs user out and routes to login

Header format:

```http
Authorization: Bearer <accessToken>
```

---

## HTTP Conventions By Endpoint Type

| Method   | Request format                                     | Response format                                  |
| -------- | -------------------------------------------------- | ------------------------------------------------ |
| `GET`    | No body. Inputs are path params and query params   | Returns requested resource/list in `data`        |
| `POST`   | JSON body required unless otherwise stated         | Returns created/triggered resource in `data`     |
| `PATCH`  | JSON body with only changed fields                 | Returns full updated resource in `data`          |
| `DELETE` | Usually no body; path or query identifies resource | Returns confirmation in `data` (or empty object) |

All non-`GET` requests use:

```http
Content-Type: application/json
```

For payment/order creation requests, backend should support idempotency:

```http
Idempotency-Key: <uuid>
```

The app sends the same key when retrying the same create-order attempt.

---

## Response Envelope

Success envelope:

```json
{
  "data": {},
  "error": null
}
```

Error envelope:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {}
  }
}
```

### Error code reference

| Code                  | Typical HTTP status | App behavior expectation                               |
| --------------------- | ------------------- | ------------------------------------------------------ |
| `VALIDATION_ERROR`    | `400`               | Show inline field errors where possible                |
| `UNAUTHORIZED`        | `401`               | Trigger refresh flow                                   |
| `FORBIDDEN`           | `403`               | Show generic error toast                               |
| `NOT_FOUND`           | `404`               | Show fallback empty/error state                        |
| `CONFLICT`            | `409`               | Show user-friendly conflict message                    |
| `OUT_OF_STOCK`        | `409`               | Disable checkout and show unavailability messaging     |
| `PAYMENT_FAILED`      | `402` or `409`      | Keep user on checkout; allow retry                     |
| `RATE_LIMITED`        | `429`               | Show retry messaging                                   |
| `SERVER_ERROR`        | `500`               | Show generic toast and allow manual retry              |
| `SERVICE_UNAVAILABLE` | `503`               | Show full-screen fallback for critical screen failures |

---

## Pagination

List endpoints are cursor-based:

```json
{
  "data": {
    "items": [],
    "nextCursor": "abc123",
    "hasMore": true
  },
  "error": null
}
```

Request query format:

```http
?cursor=abc123&limit=20
```

Default `limit`: `20`
Maximum `limit`: `50`

---

## Core Data Shapes

### Address

Current app UI uses structured fields.

```json
{
  "streetAddress": "Sunnlandsvegen 35",
  "city": "Trondheim",
  "zipCode": "7032"
}
```

Open question: Decide whether this should be stored in one single field.

### User

```json
{
  "id": "usr_123",
  "name": "John Doe",
  "email": "john@example.com",
  "deliveryAddress": {
    "streetAddress": "Sunnlandsvegen 35",
    "city": "Trondheim",
    "zipCode": "7032"
  },
  "hasSavedPaymentMethod": true,
  "createdAt": "2026-04-16T10:00:00Z",
  "updatedAt": "2026-04-16T10:00:00Z"
}
```

### Product

```json
{
  "id": "prd_123",
  "name": "Wireless Headphones",
  "description": "Premium ANC headphones",
  "price": 79.99,
  "currency": "USD",
  "imageUrl": "https://cdn.example.com/products/prd_123.png",
  "category": "audio",
  "available": true
}
```

### Order

```json
{
  "id": "ord_123",
  "userId": "usr_123",
  "productId": "prd_123",
  "productName": "Wireless Headphones",
  "status": "in_transit",
  "deliveryAddress": {
    "streetAddress": "Sunnlandsvegen 35",
    "city": "Trondheim",
    "zipCode": "7032"
  },
  "amount": {
    "subtotal": 79.99,
    "deliveryFee": 2.99,
    "total": 82.98,
    "currency": "USD"
  },
  "stripePaymentIntentId": "pi_abc123",
  "createdAt": "2026-04-16T10:00:00Z",
  "updatedAt": "2026-04-16T10:00:00Z"
}
```

### Order status enum

```text
pending_payment | confirmed | dispatched | in_transit | delivered | cancelled
```

App behavior groups:

- Active: `confirmed`, `dispatched`, `in_transit`
- Terminal: `delivered`, `cancelled`

---

## Screen To Endpoint Matrix

| Screen/route                    | Endpoint(s) used                                                |
| ------------------------------- | --------------------------------------------------------------- |
| `auth/login`                    | `POST /auth/login`, `POST /auth/google`, `POST /auth/refresh`   |
| `auth/register`                 | `POST /auth/register`, `POST /auth/google`                      |
| `tabs/index` (dashboard)        | `GET /orders/active`, `GET /orders/recent?limit=3`              |
| `tabs/browse`                   | `GET /products`                                                 |
| `products/[productId]`          | `GET /products/:id`                                             |
| `products/[productId]/checkout` | `POST /orders`                                                  |
| `tabs/orders`                   | `GET /orders?status=&cursor=&limit=`                            |
| `orders/[orderId]`              | `GET /orders/:id`, `GET /orders/:id/tracking`                   |
| `tabs/profile` / edit profile   | `GET /users/me`, `PATCH /users/me`, `PATCH /users/me/password`  |
| Manage payment method           | `GET /users/me/payment-method`, `POST /users/me/payment-method` |
| Notification lifecycle          | `POST /users/me/push-token`, `DELETE /users/me/push-token`      |
| Logout                          | `DELETE /users/me/push-token`, `POST /auth/logout`              |

---

## Endpoint Reference

### Auth

#### `POST /auth/register` (Public)

Create user and return session tokens.

Request body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "deliveryAddress": {
    "streetAddress": "Sunnlandsvegen 35",
    "city": "Trondheim",
    "zipCode": "7032"
  }
}
```

Success response:

```json
{
  "data": {
    "accessToken": "jwt_access",
    "refreshToken": "jwt_refresh",
    "user": {
      "id": "usr_123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "error": null
}
```

#### `POST /auth/login` (Public)

Request body:

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

Success response is the same shape as `POST /auth/register`.

#### `POST /auth/google` (Public)

Request body:

```json
{
  "idToken": "google_id_token"
}
```

Returns same token/user envelope as login/register.

#### `POST /auth/refresh` (Public)

Request body:

```json
{
  "refreshToken": "jwt_refresh"
}
```

Success response:

```json
{
  "data": {
    "accessToken": "new_jwt_access",
    "refreshToken": "new_jwt_refresh"
  },
  "error": null
}
```

#### `POST /auth/logout`

Invalidates access/refresh token pair.

Request body:

```json
{
  "refreshToken": "jwt_refresh"
}
```

Success response:

```json
{
  "data": {
    "success": true
  },
  "error": null
}
```

---

### Products

#### `GET /products`

Query params:

| Name       | Type     | Required | Notes                               |
| ---------- | -------- | -------- | ----------------------------------- |
| `search`   | `string` | no       | Name search, debounced 300ms in app |
| `category` | `string` | no       | Category filter                     |
| `cursor`   | `string` | no       | Cursor for pagination               |
| `limit`    | `number` | no       | Default `20`, max `50`              |

Success response:

```json
{
  "data": {
    "items": [
      {
        "id": "prd_123",
        "name": "Wireless Headphones",
        "description": "Premium ANC headphones",
        "price": 79.99,
        "currency": "USD",
        "imageUrl": "https://cdn.example.com/products/prd_123.png",
        "category": "audio",
        "available": true
      }
    ],
    "nextCursor": "cur_456",
    "hasMore": true
  },
  "error": null
}
```

#### `GET /products/:id`

Success response:

```json
{
  "data": {
    "id": "prd_123",
    "name": "Wireless Headphones",
    "description": "Premium ANC headphones",
    "price": 79.99,
    "currency": "USD",
    "imageUrl": "https://cdn.example.com/products/prd_123.png",
    "category": "audio",
    "available": true
  },
  "error": null
}
```

---

### Orders

#### `POST /orders`

Creates pending order and Stripe PaymentIntent.

Headers:

```http
Idempotency-Key: <uuid>
```

Request body:

```json
{
  "productId": "prd_123",
  "deliveryAddress": {
    "streetAddress": "Sunnlandsvegen 35",
    "city": "Trondheim",
    "zipCode": "7032"
  }
}
```

Success response:

```json
{
  "data": {
    "order": {
      "id": "ord_123",
      "status": "pending_payment",
      "productId": "prd_123",
      "deliveryAddress": {
        "streetAddress": "Sunnlandsvegen 35",
        "city": "Trondheim",
        "zipCode": "7032"
      },
      "amount": {
        "subtotal": 79.99,
        "deliveryFee": 2.99,
        "total": 82.98,
        "currency": "USD"
      }
    },
    "payment": {
      "stripePaymentIntentId": "pi_abc123",
      "paymentIntentClientSecret": "pi_abc123_secret_..."
    }
  },
  "error": null
}
```

Notes:

- Frontend does not mark order confirmed
- Backend updates status after Stripe webhook confirmation
- On failed payment retry, same PaymentIntent is reused

#### `GET /orders`

Used by Orders tab for status-filtered history.

Query params:

| Name     | Type     | Required | Notes                                     |
| -------- | -------- | -------- | ----------------------------------------- |
| `status` | `string` | no       | One of `active`, `completed`, `cancelled` |
| `cursor` | `string` | no       | Cursor pagination                         |
| `limit`  | `number` | no       | Default `20`                              |

Success response:

```json
{
  "data": {
    "items": [
      {
        "id": "ord_123",
        "productName": "Wireless Headphones",
        "status": "in_transit",
        "deliveryAddressSummary": "Sunnlandsvegen 35, Trondheim",
        "placedAt": "2026-04-16T10:00:00Z",
        "total": 82.98,
        "currency": "USD"
      }
    ],
    "nextCursor": null,
    "hasMore": false
  },
  "error": null
}
```

#### `GET /orders/active`

Returns active orders for dashboard.

Success response:

```json
{
  "data": {
    "items": [
      {
        "id": "ord_123",
        "productName": "Wireless Headphones",
        "status": "in_transit",
        "placedAt": "2026-04-16T10:00:00Z"
      }
    ]
  },
  "error": null
}
```

#### `GET /orders/recent?limit=3`

Returns recent completed orders for dashboard.

Success response:

```json
{
  "data": {
    "items": [
      {
        "id": "ord_120",
        "productName": "Bluetooth Speaker",
        "status": "delivered",
        "deliveredAt": "2026-04-16T08:45:00Z"
      }
    ]
  },
  "error": null
}
```

#### `GET /orders/:id`

Used by order detail/tracking screen and stale-notification fallback.

Success response:

```json
{
  "data": {
    "id": "ord_123",
    "productName": "Wireless Headphones",
    "status": "in_transit",
    "createdAt": "2026-04-16T10:00:00Z",
    "departedAt": "2026-04-16T10:12:00Z",
    "deliveryAddress": {
      "streetAddress": "Sunnlandsvegen 35",
      "city": "Trondheim",
      "zipCode": "7032"
    },
    "amount": {
      "subtotal": 79.99,
      "deliveryFee": 2.99,
      "total": 82.98,
      "currency": "USD"
    }
  },
  "error": null
}
```

#### `GET /orders/:id/tracking`

Polled every 5 seconds while tracking screen is visible.

Success response:

```json
{
  "data": {
    "orderId": "ord_123",
    "status": "in_transit",
    "statusLabel": "On its way",
    "drone": {
      "latitude": 63.4305,
      "longitude": 10.3951,
      "updatedAt": "2026-04-16T10:20:00Z"
    },
    "destination": {
      "latitude": 63.435,
      "longitude": 10.4003
    }
  },
  "error": null
}
```

Notes:

- If `status` is terminal (`delivered`/`cancelled`), app stops polling
- If drone position is unavailable, return `drone: null` and keep status

---

### User profile

#### `GET /users/me`

Success response:

```json
{
  "data": {
    "id": "usr_123",
    "name": "John Doe",
    "email": "john@example.com",
    "deliveryAddress": {
      "streetAddress": "Sunnlandsvegen 35",
      "city": "Trondheim",
      "zipCode": "7032"
    },
    "hasSavedPaymentMethod": true
  },
  "error": null
}
```

#### `PATCH /users/me`

Partial update of `name`, `email`, `deliveryAddress`.

Request body example:

```json
{
  "name": "John D.",
  "deliveryAddress": {
    "streetAddress": "Kongens gate 31",
    "city": "Trondheim",
    "zipCode": "7012"
  }
}
```

Success response returns updated user object.

#### `PATCH /users/me/password`

Request body:

```json
{
  "currentPassword": "old-secret",
  "newPassword": "new-secret"
}
```

Success response:

```json
{
  "data": {
    "success": true
  },
  "error": null
}
```

---

### Payment method

#### `GET /users/me/payment-method`

Returns saved card summary for profile screen.

Success response:

```json
{
  "data": {
    "hasPaymentMethod": true,
    "brand": "visa",
    "last4": "4242",
    "expMonth": 12,
    "expYear": 2026
  },
  "error": null
}
```

If no card:

```json
{
  "data": {
    "hasPaymentMethod": false
  },
  "error": null
}
```

#### `POST /users/me/payment-method`

Creates Stripe SetupIntent for add/update card flow.

Request body:

```json
{
  "returnUrl": "dronedelivery://profile/payment-method"
}
```

Success response:

```json
{
  "data": {
    "setupIntentClientSecret": "seti_123_secret_..."
  },
  "error": null
}
```

Notes:

- Backend should update stored default payment method after Stripe webhook events
- Card details are never stored in app database

---

### Push token management

#### `POST /users/me/push-token`

Register or update Expo push token after login.

Request body:

```json
{
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios",
  "deviceId": "optional-device-id"
}
```

Success response:

```json
{
  "data": {
    "success": true
  },
  "error": null
}
```

#### `DELETE /users/me/push-token`

Deregister token on logout.

Request body:

```json
{
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

Success response:

```json
{
  "data": {
    "success": true
  },
  "error": null
}
```

---

## Backend-only Event Endpoints

These are not called by the app, but are required for the full flow.

### `POST /webhooks/stripe`

- Receives `payment_intent.succeeded` to move `pending_payment -> confirmed`
- Triggers drone dispatch command after payment confirmation
- Handles SetupIntent events for saved card updates

### IoT gateway ingestion endpoint or MQTT consumer

- Receives drone telemetry and order status updates
- Persists latest position for `GET /orders/:id/tracking`
- Triggers push notifications for dispatch/nearby/delivered lifecycle events

---

## Open Questions To Resolve Before Backend Build Starts

- Auth implementation: BetterAuth vs managed provider. **Ignorer auth for øyeblikket ig, vent med profile shit**
- Final delivery address model: structured object vs single string. **Kanskje greiest med flere felter, litt lettere å jobbe med tror jeg.**
- Stripe customer creation timing: registration-time vs first payment method save. **Trenger ikke bestemme oss for akkurat nå.**
- Poll interval finalization: 5 seconds currently assumed
- Telemetry persistence depth: latest only vs full history. **IDK chief**
