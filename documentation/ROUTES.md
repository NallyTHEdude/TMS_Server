# 🏡 Property Management System – API Routes (MVP)

This document lists all backend API routes for the **Property Management MVP**.
Backend stack: **Node.js + Express + NeonDB (PostgreSQL)**
Auth: **JWT-based**
Additional: **Didit KYC verification**, **WhatsApp payment reminders**

---

## 🩺 HEALTH ROUTE (`/api/v1/health`) ✅

## 🛠️ TEST ROUTE (`/api/v1/`) ✅

## 🔖 Core concept: single `User` model with roles

- There is **one canonical `User` resource** (table): every person in the system is a `User`.
- `User` has a `role` field with values: `tenant`, `landlord` (owner), `admin` (and future roles if needed).
- **Tenant, Landlord, Admin are _references_ to the `User` record** (i.e. other resources reference `userId`), not separate user tables. This avoids duplicate profile data.
- Example references:
    - A `Property` has a `landlordId` that references `User._id` (role: `landlord`).
    - A `Tenant` record (assignment) references `userId` (role: `tenant`) and `propertyId`.

Notes: keep authentication and profile management centralized under `/api/v1/users` so all roles share the same account logic.

---

## 🧩 AUTH ROUTES (`/api/v1/auth`)

| Method  | Endpoint                           | Description                         | Status |
| ------- | ---------------------------------- | ----------------------------------- | ------ |
| `POST`  | `/register`                        | Register new user (owner or tenant) | ✅     |
| `POST`  | `/login`                           | Login and receive JWT               | ✅     |
| `POST`  | `/logout`                          | Logout (optional for JWT)           | ✅     |
| `POST`  | `/forgot-password`                 | Send password reset email           | ✅     |
| `POST`  | `/reset-password/:unhashed-token:` | Reset password using token          | ✅     |
| `PATCH` | `/change-password`                 | Change password (auth required)     | ✅     |
| `GET`   | `/resend-email-verification`       | Verify user email                   | ✅     |
| `POST`  | `/refresh-token`                   | Refresh access token (optional)     | ✅     |

**Priority for MVP:**
`/register`, `/login`, `/forgot-password`, `/change-password`

---

## 👤 USER ROUTES (`/api/v1/users`)

These endpoints manage the centralized `User` profile and settings used by all roles.

| Method   | Endpoint          | Description                             | Status |
| -------- | ----------------- | --------------------------------------- | ------ |
| `GET`    | `/profile`        | Get logged-in user's profile            | ✅     |
| `PATCH`  | `/update-details` | Update user details (name, phone, etc.) | ✅     |
| `PATCH`  | `/update-avatar`  | Upload or update profile picture        | ✅     |
| `DELETE` | `/delete-account` | Delete own account                      | ✅     |

**Role management & notes**

- Change role (e.g. `user` -> `landlord`) should be restricted and controlled (admin approval or via a tenant-to-landlord workflow).
- Do **not** duplicate KYC endpoints here — KYC belongs to tenants (see Tenant routes).

**Priority for MVP:**
`/me`, `/update-details`, `/update-avatar`, `/delete`

---

## 🏠 PROPERTY ROUTES (`/api/v1/properties`)

| Method   | Endpoint                  | Description                                              | Status |
| -------- | ------------------------- | -------------------------------------------------------- | ------ |
| `POST`   | `/add`                    | Add a new property (auth + landlord role required)       | ✅     |
| `GET`    | `/all`                    | Get all properties owned by the logged-in landlord       | ✅     |
| `GET`    | `/:propertyId`            | Get a single property’s details                          | ✅     |
| `PUT`    | `/:propertyId/update`     | Update property info (owner or admin)                    | ✅     |
| `POST`   | `/:propertyId/add-issues` | Add issues raised by the logged-in tenant (role: tenant) | ✅     |
| `DELETE` | `/:propertyId/delete`     | Delete a property (owner or admin)                       | ✅     |

**Priority for MVP:**
`/add`, `/all`, `/:propertyId` , `/:propertyId/add-issue`

Data model note: Property stores `landlordId` that references `User.id`.

---

## 👥 TENANT ROUTES (`/api/v1/tenants`)

Tenant endpoints manage tenant-specific actions and tenant records that reference `User`.

| Method | Endpoint                  | Description                                                           | Status |
| ------ | ------------------------- | --------------------------------------------------------------------- | ------ |
| `POST` | `/assign-property/userId` | Assign a tenant (a `userId`) to a property (create tenant assignment) | ✅     |
| `GET`  | `/property/:propertyId`   | Get all tenants under a specific property                             | ✅     |
| `GET`  | `/profile`                | Get property details assigned to the tenant (tenant's view)           | ✅     |
| `POST` | `/remove/:tenantId`       | Remove tenant from property (unassign)                                | ✅     |
| `GET`  | `/kyc-status/:tenantId`   | Get KYC verification status for a tenant (`userId`)                   | ✅     |
| `POST` | `/kyc-verify`             | Trigger Didit KYC verification process for a tenant                   | ✅     |

**Important change:** KYC endpoints are **only for tenants** (tenants are the ones who provide KYC documents). Landlords and admins do not use the tenant KYC endpoints.

**Priority for MVP:**
`/assign-property/userId`, `/property/:propertyId`, `/me`, `/kyc-verify/:tenantId`, `/kyc-status/:tenantId`

Implementation notes:

- `assign` should accept `userId` (tenant's user) and `propertyId`.
- KYC endpoints should validate that the `userId` has `role: tenant` before triggering verification.

---

## 🏛️ LANDLORD ROUTES (`/api/v1/landlords`)

Landlord endpoints are convenience wrappers and landlord-specific views that operate on `User` records with `role: landlord`. Property CRUD is primarily under `/properties`, but these endpoints simplify landlord workflows.

| Method | Endpoint                | Description                                                                         | Status |
| ------ | ----------------------- | ----------------------------------------------------------------------------------- | ------ |
| `GET`  | `/dashboard`            | Get logged-in landlord's dashboard (properties, tenants overview, earnings summary) |        |
| `GET`  | `/properties`           | Get all properties owned by the logged-in landlord (alias for `/properties/all`)    | ✅     |
| `GET`  | `/tenants/:propertyId`  | Get all tenants for a specific property owned by the landlord                       | ✅     |
| `GET`  | `/properties/filter?`   | Get all properties based on selected filters by the landlord                        | ✅     |
| `GET`  | `/payments/:propertyId` | Get payments/earnings for a property (landlord's view)                              |        |
| `POST` | `/payouts/initiate`     | Trigger payout transfer to landlord (integration with payment provider)             |        |

**Priority for MVP:**
`/properties`, `/tenants/:propertyId`

Notes:

- Landlord endpoints must validate `role: landlord` for the requesting user.
- Sensitive payout fields (bank details) should be encrypted at rest and only accessible to authorized systems.
- Most property-level operations should still live under `/properties` (single source of truth).

---

## 💸 PAYMENT ROUTES (`/api/v1/payments`) (`/api/v1/payments`)

| Method | Endpoint               | Description                                          | Status |
| ------ | ---------------------- | ---------------------------------------------------- | ------ |
| `POST` | `/initiate`            | Initiate rent payment (Stripe/Razorpay)              |        |
| `POST` | `/confirm`             | Confirm successful payment (via webhook or callback) |        |
| `GET`  | `/history/:propertyId` | Get payment history for a property                   |        |
| `GET`  | `/reminders/send`      | Send WhatsApp rent reminder                          |        |
| `POST` | `/receipt`             | Generate or resend payment receipt                   |        |

**Priority for MVP:**
`/initiate`, `/history/:propertyId`, `/reminders/send`

Notes:

- Payment webhooks should authenticate the payment provider and update payment records that reference `propertyId`, `tenantId` (userId), and `landlordId`.
- WhatsApp reminders should be able to target `tenant` contact info pulled from the referenced `User` record.

---

## 🧠 OPTIONAL FUTURE ROUTES

| Method            | Endpoint                                            | Description                                          | Status |
| ----------------- | --------------------------------------------------- | ---------------------------------------------------- | ------ |
| **Analytics**     | `/api/analytics/earnings`, `/api/analytics/tenants` | Earnings and tenant analytics (admin/landlord views) |        |
| **Notifications** | `/api/notifications/all`, `/api/notifications/read` | System notifications for users                       |        |
| **Support**       | `/api/support/contact`, `/api/support/ticket`       | Support contact and tickets                          |        |

---

## ✅ Summary of the requested change (implementation-friendly)

1. Centralize _user identity_ in one `User` model with a `role` attribute. Tenant/landlord/admin are roles and referenced by other resources via `userId`.
2. Move KYC endpoints out of generic `User` routes and into `Tenant` routes: only tenants can trigger or have a KYC status.
3. Admin operations on KYC should explicitly operate on tenant records only (validate `role: tenant`).

---

If you want, I can also:

- provide example request/response shapes for the KYC endpoints;
- sketch the simplest database schema (Postgres tables and key fields) to match this routes layout.
