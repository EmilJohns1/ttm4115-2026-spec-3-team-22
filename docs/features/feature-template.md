<!-- Read this when implementing or modifying [feature name] -->

# Feature: [Feature name]

## Overview

<!-- 2–3 sentences: what this feature does, who it's for, and why it exists.
     Focus on intent, not implementation. -->

**Status:** `planned` | `in progress` | `done`

---

## Behaviour spec

### [Main flow name]

<!-- Describe the primary happy path as a user story. -->

**Given** [precondition],
**when** [action],
**then** [expected outcome].

### [Secondary flow name]

<!-- Add additional flows as needed — one section per distinct user journey. -->

**Given** [precondition],
**when** [action],
**then** [expected outcome].

### Edge cases

<!-- List the non-obvious cases the agent must handle. Remove any that don't apply. -->

- **Empty state** — [what the UI shows when there is no data]
- **Loading state** — [how loading is indicated; prefer skeleton loaders]
- **Network error** — show a toast: "[User-friendly error message]. Please try again."
- **Permission boundary** — [what happens if the user lacks access]
- **[Other edge case]** — [description]

### Out of scope

<!-- Explicitly state what this feature does NOT do. Prevents scope creep. -->

- [Thing this feature intentionally excludes]
- [Another exclusion]

---

## Data & API

### Models touched

<!-- List the database models this feature reads from or writes to, and which fields. -->

- `[Model]` — reads `[field]`, `[field]`; writes `[field]`

### Endpoints used

| Method   | Path              | Purpose       |
| -------- | ----------------- | ------------- |
| `GET`    | `/[resource]`     | [Description] |
| `POST`   | `/[resource]`     | [Description] |
| `PATCH`  | `/[resource]/:id` | [Description] |
| `DELETE` | `/[resource]/:id` | [Description] |

### Example response

<!-- Optional — include if the response shape is non-obvious or important to get right. -->

```json
{
  "data": {}
}
```

---

## Constraints & hard rules

<!-- Absolute rules specific to this feature. State as prohibitions or invariants.
     These are things the agent must never do, or must always do, regardless of context. -->

- Must never [X]
- Always [Y] before [Z]
- [Field] must be validated on the server, not only the client

---

## Open questions

<!-- Decisions still unresolved. The agent must flag these in chat rather than assuming.
     Remove this section entirely once all questions are resolved. -->

- [ ] [Question or ambiguity that needs a decision]
- [ ] [Another open question]
