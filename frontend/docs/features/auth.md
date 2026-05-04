<!-- Read this when implementing or modifying authentication, registration, or session management -->

# Feature: Auth

## Overview

Allows customers to create an account and log in to the app. Authentication is required before accessing any personalised feature (orders, tracking, profile). The auth approach is partially decided — see open questions for the outstanding BetterAuth vs Auth provider decision.

**Status:** `planned`

---

## Behaviour spec

### Registration

**Given** a user opens the app for the first time,
**when** they navigate to the register screen and submit valid details,
**then** an account is created, they are logged in automatically, and redirected to the dashboard tab.

### Login

**Given** a returning user opens the app,
**when** they submit valid credentials on the login screen,
**then** they are authenticated and redirected to the dashboard tab.

### Social login (Google)

**Given** a user is on the login or register screen,
**when** they tap "Continue with Google",
**then** the Google OAuth flow completes and they are logged in and redirected to the dashboard tab. If no account exists, one is created automatically.

### Persistent session

**Given** a user has previously logged in,
**when** they reopen the app,
**then** they are taken directly to the dashboard tab without needing to log in again.

### Logout

**Given** a logged-in user navigates to their profile,
**when** they tap logout,
**then** their session is cleared, their push token is deregistered from the backend, and they are returned to the login screen.

### Edge cases

- **Invalid credentials** — show an inline error: "Incorrect email or password"
- **Duplicate email** — show an inline error: "An account with this email already exists"
- **Network error** — show a toast: "Login failed. Please try again."
- **Token expiry** — silently attempt a token refresh; if it fails, redirect to the login screen with a toast: "Your session has expired. Please log in again."
- **Google login failure** — show a toast: "Google sign-in failed. Please try again."

### Out of scope

- Password reset flow — not required for demo
- Email verification — not required for demo
- Apple login — not required for demo
- Password strength validation — not required for demo; minimum length only

---

## Data & API

### Models touched

- `User` — `id`, `email`, `name`, `passwordHash` (if email/password), `googleId` (if Google), `pushToken`

### Endpoints used

| Method | Path             | Purpose                                                 |
| ------ | ---------------- | ------------------------------------------------------- |
| `POST` | `/auth/register` | Create a new account and return a session token         |
| `POST` | `/auth/login`    | Authenticate and return a session token                 |
| `POST` | `/auth/google`   | Handle Google OAuth callback and return a session token |
| `POST` | `/auth/refresh`  | Exchange an expiring token for a new one                |
| `POST` | `/auth/logout`   | Invalidate the current token                            |

### Token storage

- Store the auth token securely using `expo-secure-store`
- Attach to all subsequent requests via `fetchWithAuth` in `utils/api.ts`
- Refresh logic lives in `utils/api.ts` — do not duplicate it in components or services

---

## Constraints & hard rules

- Never store the auth token in `AsyncStorage` — use `expo-secure-store` only
- Never expose the token in logs — `logger` must not print auth tokens
- All auth forms must use React Hook Form and Zod validation
- Token refresh must be attempted silently before showing a session expiry message
- Push token must be deregistered on logout — call `DELETE /users/me/push-token` before clearing the session

---

## Open questions

- [ ] **Auth library** — BetterAuth (self-hosted, TypeScript-first) vs a managed Auth provider (Auth0, Clerk). Decision pending. Both support Google OAuth and email/password; the difference is infrastructure ownership vs managed service.
- [ ] **Token expiry duration** — to be defined when backend is set up
