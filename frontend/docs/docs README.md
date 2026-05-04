# Docs index

Read this file at the start of every session before opening any other file. Use the table below to identify which documents are relevant to your current task, then read only those.

---

## When to read what

| File                 | Read when...                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `architecture.md`    | Starting any feature; making structural, data flow, or system design decisions           |
| `api-spec.md`        | Writing or modifying any API call, endpoint, or TanStack Query hook                      |
| `backend-handoff.md` | Planning backend implementation from app screens, flows, and payload expectations        |
| `conventions.md`     | Making decisions about UI structure, navigation, state, error handling, or folder layout |
| `features/<name>.md` | Implementing or modifying that specific feature                                          |

---

## Feature index

| File                           | Feature                                               | Status    |
| ------------------------------ | ----------------------------------------------------- | --------- |
| `backend-handoff.md`           | Screen-to-endpoint mapping for backend implementation | `ready`   |
| `features/auth.md`             | Registration, login, Google OAuth, session management | `planned` |
| `features/browse-products.md`  | Product catalogue, search, pagination, product detail | `planned` |
| `features/dashboard.md`        | Default landing screen, active orders, quick actions  | `planned` |
| `features/edit-profile.md`     | Name, email, delivery address, saved payment method   | `planned` |
| `features/notifications.md`    | Push notifications via Expo Push API                  | `planned` |
| `features/order-product.md`    | Checkout, Stripe payment, retry flow                  | `planned` |
| `features/order-tracking.md`   | Live drone map, polling, status banner                | `planned` |
| `features/feature-template.md` | Template — copy this for new features                 | —         |

---

## Open questions

Decisions not yet made that affect multiple parts of the system. Flag these in chat rather than resolving them silently.

- **Backend language and framework** — not yet decided
- **Database** — not yet decided; PostgreSQL recommended
- **Auth library** — BetterAuth (self-hosted, TypeScript-first) vs a managed Auth provider (Auth0, Clerk); both support Google OAuth and email/password
- **Hosting** — not yet decided
- **Drone telemetry storage** — full history vs latest position only
- **Tracking poll interval** — assumed 5 seconds; confirm against IoT gateway publish frequency
- **Delivery address format** — single text field vs structured (street, city, postcode)
- **Stripe Customer ID creation** — on registration vs lazily on first payment
