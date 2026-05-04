# API Spec (Trimmed)

Auth, payments, push notifications, and webhooks are out of scope for now.

---

## Environments

| Environment | Base URL                    |
| ----------- | --------------------------- |
| Development | `http://localhost:8000/api` |

---

## Response Envelope

All responses use this shape:

Success:
```json
{ "data": {}, "error": null }
```

Error:
```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Order not found"
  }
}
```

Relevant error codes:

| Code               | HTTP status |
| ------------------ | ----------- |
| `VALIDATION_ERROR` | `400`       |
| `NOT_FOUND`        | `404`       |
| `SERVER_ERROR`     | `500`       |

---

## Core Data Shapes

### Address
```json
{
  "streetAddress": "Sunnlandsvegen 35",
  "city": "Trondheim",
  "zipCode": "7032"
}
```

### User
```json
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "deliveryAddress": {
    "streetAddress": "Sunnlandsvegen 35",
    "city": "Trondheim",
    "zipCode": "7032"
  }
}
```

### Product
```json
{
  "id": "123",
  "name": "Wireless Headphones",
  "description": "Premium ANC headphones",
  "price": 79.99,
  "currency": "NOK",
  "imageUrl": "https://cdn.example.com/products/123.png",
  "category": "audio",
  "available": true
}
```

### Order
```json
{
  "id": "ord_123",
  "userId": "123",
  "productId": "123",
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
    "currency": "NOK"
  },
  "createdAt": "2026-04-16T10:00:00Z",
  "updatedAt": "2026-04-16T10:00:00Z"
}
```

### Order status enum
```
pending | confirmed | dispatched | in_transit | delivered | cancelled
```

- Active: `confirmed`, `dispatched`, `in_transit`
- Terminal: `delivered`, `cancelled`

---

## Endpoints

### Products

#### `GET /products`

Query params:

| Name       | Type     | Required | Notes           |
| ---------- | -------- | -------- | --------------- |
| `search`   | `string` | no       | Name search     |
| `category` | `string` | no       | Category filter |

Success response:
```json
{
  "data": {
    "items": [
      {
        "id": "123",
        "name": "Wireless Headphones",
        "price": 79.99,
        "currency": "NOK",
        "imageUrl": "https://cdn.example.com/products/123.png",
        "category": "audio",
        "available": true
      }
    ]
  },
  "error": null
}
```

#### `GET /products/:id`

Success response:
```json
{
  "data": {
    "id": "123",
    "name": "Wireless Headphones",
    "description": "Premium ANC headphones",
    "price": 79.99,
    "currency": "NOK",
    "imageUrl": "https://cdn.example.com/products/123.png",
    "category": "audio",
    "available": true
  },
  "error": null
}
```

---

### Orders

#### `POST /orders`

Request body:
```json
{
  "userId": "123",
  "productId": "123",
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
    "id": "ord_123",
    "status": "confirmed",
    "productId": "123",
    "deliveryAddress": {
      "streetAddress": "Sunnlandsvegen 35",
      "city": "Trondheim",
      "zipCode": "7032"
    },
    "amount": {
      "subtotal": 79.99,
      "deliveryFee": 2.99,
      "total": 82.98,
      "currency": "NOK"
    }
  },
  "error": null
}
```

#### `GET /orders`

Query params:

| Name     | Type     | Required | Notes                              |
| -------- | -------- | -------- | ---------------------------------- |
| `userId` | `string` | yes      | Filter by user                     |
| `status` | `string` | no       | `active`, `delivered`, `cancelled` |

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
        "currency": "NOK"
      }
    ]
  },
  "error": null
}
```

#### `GET /orders/active`

Returns active orders (confirmed/dispatched/in_transit) for the dashboard.

Query params: `userId` (required)

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

#### `GET /orders/recent`

Query params: `userId` (required), `limit` (default 3)

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
      "currency": "NOK"
    }
  },
  "error": null
}
```

#### `GET /orders/:id/tracking`

Polled every 5 seconds while tracking screen is open. App stops polling when status is `delivered` or `cancelled`.

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

If drone position unavailable: return `"drone": null` and keep status.

---

### User profile

#### `GET /users/me`

Query params: `userId` (required, until auth is added)

Success response:
```json
{
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "deliveryAddress": {
      "streetAddress": "Sunnlandsvegen 35",
      "city": "Trondheim",
      "zipCode": "7032"
    }
  },
  "error": null
}
```

#### `PATCH /users/me`

Partial update of `name`, `email`, `deliveryAddress`.

Request body example:
```json
{
  "userId": "123",
  "deliveryAddress": {
    "streetAddress": "Kongens gate 31",
    "city": "Trondheim",
    "zipCode": "7012"
  }
}
```

Returns updated user object in same shape as `GET /users/me`.

---

## MQTT (drone telemetry — backend internal)

Not called by the app. The backend MQTT consumer listens on these topics and updates `DroneStatus` in the DB, which feeds `GET /orders/:id/tracking`.

| Topic                        | Direction      | Payload                                      |
| ---------------------------- | -------------- | -------------------------------------------- |
| `drones/{droneId}/telemetry` | drone → server | `{ lat, lon, battery, timestamp }`           |
| `drones/{droneId}/status`    | drone → server | `{ orderId, status }`                        |
| `drones/{droneId}/command`   | server → drone | `{ command: "dispatch", destination: {...} }` |
