<!-- Read this when implementing or modifying product browsing, search, or the product detail screen -->

# Feature: Browse products

## Overview

Allows customers to explore the available product catalogue, search and filter by category, and view individual product details before placing an order.

**Status:** `planned`

---

## Behaviour spec

### Product listing

**Given** a logged-in user opens the browse tab,
**when** the screen loads,
**then** the first page of available products is displayed with name, image, price, and category.

### Pagination

**Given** a user scrolls to the bottom of the product list,
**when** more products are available,
**then** the next page loads automatically (infinite scroll). A loading indicator is shown at the bottom while fetching.

### Search

**Given** a user is on the browse screen,
**when** they type in the search bar,
**then** the product list filters to show matching results by name. Search is debounced at 300ms.

### Category filter

**Given** a user is on the browse screen,
**when** they select a category filter,
**then** only products belonging to that category are shown. Search and category filters can be combined.

### Product detail

**Given** a user taps a product in the list,
**when** the detail screen loads,
**then** they see the full product name, image, description, price, and an "Order now" button.

### Edge cases

- **Empty state** — if no products are available, show: "No products available right now"
- **Empty search results** — show: "No products match your search"
- **Loading state** — show a skeleton loader for the initial page load
- **Network error** — show a toast: "Couldn't load products. Please try again." with a retry button
- **Out of stock** — show the product greyed out with an "Unavailable" label; hide the "Order now" button

### Out of scope

- Favourites or saved products — not required for demo
- Product reviews or ratings — not required for demo
- Sort order — not required for demo

---

## Data & API

### Models touched

- `Product` — `id`, `name`, `description`, `price`, `imageUrl`, `category`, `available`

### Endpoints used

| Method | Path            | Purpose                                                                                |
| ------ | --------------- | -------------------------------------------------------------------------------------- |
| `GET`  | `/products`     | Fetch paginated product list; supports `?search=`, `?category=`, `?cursor=`, `?limit=` |
| `GET`  | `/products/:id` | Fetch a single product's full details                                                  |

---

## Constraints & hard rules

- Product data must be fetched via TanStack Query — do not fetch in components directly
- Do not show unavailable products with an active "Order now" button under any circumstance
- Search must be debounced at 300ms before triggering an API call
- Pagination uses cursor-based infinite scroll — do not use page-number-based pagination

---

## Open questions

- [ ] **Categories** — what categories exist? To be defined when the product catalogue is seeded
- [ ] **Page size** — confirm default `limit` per page (suggested: 20)
- [ ] **Images** — where are product images hosted? CDN URL pattern needed for `api-spec.md`
