<!-- Read this when implementing or modifying the order placement or checkout flow -->

# Feature: Order product

## Overview

Allows a logged-in customer to place a drone delivery order for a single product. Includes per-order delivery address confirmation and payment via Stripe (test mode). Multiple active orders are allowed simultaneously.

**Status:** `planned`

---

## Behaviour spec

### Initiating an order

**Given** a user is on the product detail screen,
**when** they tap "Order now",
**then** they are taken to a checkout screen showing the product, a pre-filled delivery address, and the total price.

### Delivery address at checkout

**Given** a user is on the checkout screen,
**when** the form loads,
**then** their saved profile delivery address is pre-filled. The user may edit this address for the current order only — it does not overwrite their saved profile address.

### Payment

**Given** a user confirms their delivery address,
**when** they tap "Pay now",
**then** the Stripe payment sheet appears. If a saved card exists on their profile it is used by default; otherwise they enter card details manually.

### Order confirmation

**Given** a user completes payment,
**when** Stripe confirms the transaction via webhook,
**then** the order is created, a confirmation notification is sent, the order appears on the dashboard, and the user is navigated to the order tracking screen.

### Payment failure and retry

**Given** a payment attempt fails,
**when** the Stripe payment sheet closes with an error,
**then** a toast is shown: "Payment failed. Please try again." The user remains on the checkout screen with a "Try again" button. The same Stripe payment intent is reused for the retry — a new order is not created.

### Edge cases

- **No delivery address** — if the user has no saved address and enters none at checkout, show an inline error before the payment sheet is presented
- **Network error** — show a toast: "Something went wrong. Please try again."
- **Out of stock** — the "Order now" button is not shown for unavailable products (enforced in browse feature)

### Out of scope

- Ordering multiple products in one order — not required for demo
- Order cancellation — not required for demo
- Promo codes or discounts — not required for demo

---

## Data & API

### Models touched

- `Order` — `id`, `userId`, `productId`, `deliveryAddress`, `status`, `stripePaymentIntentId`, `createdAt`
- `Product` — `id`, `name`, `price`
- `User` — `deliveryAddress`, `stripeCustomerId`

### Endpoints used

| Method | Path      | Purpose                                                                  |
| ------ | --------- | ------------------------------------------------------------------------ |
| `POST` | `/orders` | Create a pending order and receive a Stripe payment intent client secret |

### Payment flow

1. App calls `POST /orders` — backend creates a pending order and a Stripe payment intent, returns the client secret
2. App presents the Stripe payment sheet using the client secret (uses saved card if available)
3. User completes payment in the sheet
4. Stripe sends a webhook to the backend confirming payment
5. Backend marks the order as confirmed and dispatches the drone
6. Order appears on the dashboard under active orders

The frontend must not mark an order as confirmed itself — this happens exclusively via the Stripe webhook on the backend.

---

## Constraints & hard rules

- Never mark an order as confirmed from the frontend — wait for the backend webhook
- Payment must always go through Stripe — do not simulate or skip payment even in demo mode
- The per-order delivery address must never overwrite the user's saved profile address
- Delivery address must be validated before the payment sheet is presented
- On payment failure, reuse the existing Stripe payment intent — do not create a new order

---

## Open questions

- [ ] **Pending order on payment failure** — should the pending order be deleted after repeated failures, or kept indefinitely until confirmed or manually cleaned up?
- [ ] **Stripe Customer ID** — if the user has no saved card, should a Stripe Customer record still be created at checkout to support future card saving?
