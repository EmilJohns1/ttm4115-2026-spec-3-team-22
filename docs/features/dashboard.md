<!-- Read this when implementing or modifying the dashboard or home screen -->

# Feature: Dashboard

## Overview

The default landing screen of the app. Gives the customer a quick overview of all active orders and shortcuts to key actions. Active orders appear here when placed and are removed when delivery is complete.

**Status:** `planned`

---

## Behaviour spec

### Active orders

**Given** a logged-in user has one or more orders in progress,
**when** they open the dashboard,
**then** a card is shown for each active order displaying the product name, current status, and a link to the tracking screen.

**Given** an order's status changes to "delivered",
**when** the dashboard is next loaded or refreshed,
**then** that order's card is removed from the active orders section.

### Recent orders

**Given** a logged-in user has completed previous orders,
**when** they open the dashboard,
**then** their most recently completed orders (up to 3) are listed with product name and status.

### Quick actions

**Given** a user is on the dashboard,
**when** they tap "Browse products",
**then** they are navigated to the browse tab.

### Edge cases

- **No active orders** — hide the active orders section entirely; do not show an empty state for it
- **No order history** — show: "No orders yet. Head to Browse to place your first order."
- **Loading state** — show skeleton loaders for the active orders section and recent orders list
- **Network error** — show a toast: "Couldn't load your dashboard. Please try again."

### Out of scope

- Promotions or banners — not required for demo
- Recommended products — not required for demo

---

## Data & API

### Models touched

- `Order` — `id`, `status`, `product`, `createdAt`

### Endpoints used

| Method | Path                     | Purpose                                                     |
| ------ | ------------------------ | ----------------------------------------------------------- |
| `GET`  | `/orders/active`         | Fetch all current in-progress orders for the logged-in user |
| `GET`  | `/orders/recent?limit=3` | Fetch the most recently completed orders                    |

---

## Constraints & hard rules

- Active orders are those with a status of `confirmed`, `dispatched`, or `in_transit` — never show `pending`, `delivered`, or `cancelled` orders in the active section
- Dashboard data must refresh each time the screen comes into focus — use TanStack Query's `refetchOnWindowFocus`
- Each active order card must link directly to that order's tracking screen

---

## Open questions

- [ ] **Active order statuses** — confirm the full set of statuses used by the backend (`pending`, `confirmed`, `dispatched`, `in_transit`, `delivered`, `cancelled`)
