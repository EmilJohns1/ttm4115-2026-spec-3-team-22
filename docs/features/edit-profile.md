<!-- Read this when implementing or modifying the user profile or account settings screens -->

# Feature: Edit profile

## Overview

Allows logged-in customers to view and update their personal information, including name, email, delivery address, and saved payment method via Stripe. Lives within the profile tab.

**Status:** `planned`

---

## Behaviour spec

### View profile

**Given** a logged-in user navigates to the profile tab,
**when** the screen loads,
**then** their current name, email, and saved delivery address are displayed.

### Edit profile

**Given** a user is on the profile screen,
**when** they tap "Edit" and modify their details,
**then** the changes are saved to the backend and the updated values are shown.

### Delivery address

**Given** a user opens the edit profile form,
**when** the form renders,
**then** the saved delivery address is pre-filled and editable. Saving the form updates the stored address.

### Change password

**Given** a user is on the profile screen,
**when** they tap "Change password" and submit a valid current password and a new password meeting the minimum length,
**then** their password is updated and a toast confirms: "Password updated successfully."

### Saved payment method

**Given** a user is on the profile screen,
**when** they tap "Manage payment method",
**then** the Stripe payment sheet opens allowing them to add or update a saved card. The card is stored by Stripe and referenced by a Stripe Customer ID — card details are never stored in the app's database.

### Edge cases

- **Invalid email format** — show an inline error: "Please enter a valid email address"
- **Email already in use** — show an inline error: "This email is already associated with another account"
- **Wrong current password** — show an inline error: "Current password is incorrect"
- **Network error on save** — show a toast: "Couldn't save changes. Please try again."
- **Loading state** — show a skeleton loader while profile data is being fetched
- **No saved payment method** — show: "No payment method saved" with an "Add card" button

### Out of scope

- Profile photo upload — not required for demo
- Account deletion — not required for demo
- Notification preferences — not required for demo
- Password strength validation — not required for demo; minimum length only

---

## Data & API

### Models touched

- `User` — `id`, `name`, `email`, `deliveryAddress`, `stripeCustomerId`

### Endpoints used

| Method  | Path                       | Purpose                                          |
| ------- | -------------------------- | ------------------------------------------------ |
| `GET`   | `/users/me`                | Fetch the current user's profile                 |
| `PATCH` | `/users/me`                | Update name, email, or delivery address          |
| `PATCH` | `/users/me/password`       | Update password (requires current password)      |
| `GET`   | `/users/me/payment-method` | Fetch the saved Stripe payment method summary    |
| `POST`  | `/users/me/payment-method` | Create or update the saved Stripe payment method |

---

## Constraints & hard rules

- Password change must always require the current password — never allow an update without verifying the existing one
- All profile fields must be validated with Zod before submission
- Card details must never be stored in the app's database — only the Stripe Customer ID is persisted
- Editing the delivery address here is the only way to update the stored address — checkout uses a per-order address that never overwrites this

---

## Open questions

- [ ] **Delivery address format** — single text field or structured (street, city, postcode)? Affects both the form and the data model
- [ ] **Stripe Customer ID creation** — should a Stripe Customer be created on registration, or lazily on first payment method save?
