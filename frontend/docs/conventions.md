# Conventions

This file defines conventions for UI, error handling, state management, API communication, and project structure. Consult it before making any decisions in these areas.

---

## Project structure

Run `tree -I 'node_modules|.git' > tree.txt` at the start of a session and use `tree.txt` as your reference for the current folder layout. Do not assume where files live — check the tree first.

Folder conventions:

- `app/` — Expo Router screens and layouts
- `components/` — shared UI components
- `services/` — TanStack Query hooks and API call definitions
- `types/` — shared TypeScript types derived from Zod schemas
- `utils/` — pure utility functions (including `logger.ts` and `api.ts`)
- `constants/` — static values, config, and env var references
- `context/` — React Context providers for shared UI state

---

## Navigation structure

The app uses bottom tab navigation with four tabs. Each tab has its own stack for deeper navigation. Do not introduce additional top-level tabs without asking first.

```
(tabs)/
  home/           ← home dashboard
  browse/         ← product listing and product detail
  orders/         ← order history and order tracking
  profile/        ← user profile and settings
```

```
(stacks)/
  product-details/         ← Detailed product view (after pressing specific product)
  edit-profile/            ← Editing user details (after pressing "edit profile" or specific profile information field)
  order-tracking/          ← Tracking details (after pressing a specific ongoing delivery)
  product-checkout/        ← Product checkout screen (after pressing "order now" on product details)
```

The following showcases the navigation structure. Home, Browse, Orders, Profile are accessible from the bottom nav bar when in either of these root tabs.

```
flowchart TB
    Login["Login"] --> Home["Home /"]
    Register["Register"] --> Home
    Browse["Browse /"] <--> ProductDetails["Product Details"]
    ProductDetails <--> ProductCheckout["Checkout"]
    Profile["Profile /"] <--> EditProfile["Edit Profile"]
    Orders["Orders /"] <--> OrderTracking["Order Tracking"]
    Home <--> OrderTracking
    ProductCheckout --> OrderTracking
```

---

## State management

Keep a clear boundary between server state and UI state:

- **Server state** (products, orders, drone position, user profile) — always managed via TanStack Query. Do not put server data into Context or `useState`.
- **UI state** (modals, temporary form state, selected filters) — managed via local `useState`, or React Context if it needs to be shared across components.
- Avoid prop drilling beyond two levels — lift to Context instead.

---

## API communication

- All API calls are defined as TanStack Query hooks in `services/` — do not fetch data directly inside components
- Use `fetch` as the HTTP client — do not introduce `axios`
- Auth tokens are attached via a shared `fetchWithAuth` wrapper in `utils/api.ts`
- All response shapes are validated with Zod at the service layer before being returned to the UI

### Environment variables

- `EXPO_PUBLIC_` prefix for any value needed on the client (e.g. `EXPO_PUBLIC_API_URL`)
- Secrets that must not reach the client go in `.env.local`
- Always reference env vars through `constants/env.ts` — never inline `process.env` calls in components or services

---

## Error handling

Follow this pattern consistently across the app:

- **API and network errors** — show a toast via `react-native-toast-message`, triggered from TanStack Query's `onError` callback. Messages must be short and user-friendly (e.g. "Couldn't load products. Please try again."). Never expose raw error messages or status codes to the user.
- **Form validation errors** — show inline, below the relevant field, using React Hook Form's error state. Zod schemas are the source of all validation rules.
- **Catastrophic failures** (app cannot reach the backend) — show a full-screen error UI with a retry button. Do not leave the user on a blank or broken screen.
- Never silently swallow errors — always handle or log them via `logger.error`.
