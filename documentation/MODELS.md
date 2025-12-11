# 🧱 Database Models (Property Management System)

This document defines the main **database models** for the **Property Management System MVP** (Node.js + Express + NeonDB / MongoDB hybrid design).
Each model includes its fields, relationships, and constraints — aligned with the existing backend architecture.

---

## 👤 USER MODEL (`User`) ✅

| Field                       | Type                                    | Description                                     |
| --------------------------- | --------------------------------------- | ----------------------------------------------- |
| `id`                        | ObjectId (PK)                           | Unique identifier for the user                  |
| `role`                      | String (Enum → `AvailableUserRoles`)    | User role (`tenant`, `landlord`, `admin`, etc.) |
| `avatar`                    | Object `{ url, localPath }`             | Profile picture and its local path              |
| `username`                  | String (unique, indexed)                | Unique username                                 |
| `fullName`                  | String                                  | User’s full name                                |
| `email`                     | String (unique, lowercase)              | User’s login email                              |
| `password`                  | String                                  | Hashed password                                 |
| `isEmailVerified`           | Boolean                                 | Whether user’s email is verified                |
| `refreshToken`              | String                                  | JWT refresh token                               |
| `forgotPasswordToken`       | String                                  | Token for resetting password                    |
| `forgotPasswordTokenExpiry` | Date                                    | Expiry time for reset token                     |
| `emailVerificationToken`    | String                                  | Token for email verification                    |
| `emailVerificationExpiry`   | Date                                    | Expiry for email verification token             |
| `status`                    | ENUM('active', 'inactive', 'suspended') | Account status                                  |
| `createdAt`                 | Date                                    | Auto-generated timestamp                        |
| `updatedAt`                 | Date                                    | Auto-updated timestamp                          |

**Methods implemented:**

- `comparePassword(password)` → verifies a plain password using bcrypt.
- `generateAccessToken()` → signs and returns a short-lived JWT.
- `generateRefreshToken()` → signs and returns a long-lived JWT.
- `generateTemporaryToken()` → returns `{ unHashedToken, hashedToken, tokenExpiry }` for password reset or email verification.

**Default Values:**

- `isEmailVerified` → `false`
- `avatar` → `https://www.placehold.co/200x200`

---

## 🏠 PROPERTY MODEL (`Property`) ✅

| Field           | Type                                                        | Description                                    |
| --------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| `id`            | UUID / ObjectId (PK)                                        | Unique identifier for property                 |
| `status`        | ENUM('vacant', 'occupied', 'under_maintenance', 'inactive') | Property status                                |
| `name`          | String                                                      | Property title or name                         |
| `description`   | String                                                      | Optional property description                  |
| `issues`        | [ISSUES-SUB-OBJECTS]                                        | Tenant–reported issues (e.g., water, plumbing) |
| `country`       | String                                                      | Country name                                   |
| `state`         | String                                                      | State name                                     |
| `city`          | String                                                      | City name                                      |
| `pincode`       | String                                                      | Postal code                                    |
| `address`       | String                                                      | Full address of property                       |
| `landlordId`    | FK → `User.id`                                              | References landlord owning the property        |
| `type`          | ENUM('apartment', 'villa', 'flat', 'commercial')            | Property type                                  |
| `rentAmount`    | Number (decimal)                                            | Monthly rent amount                            |
| `depositAmount` | Number (decimal)                                            | Security deposit amount                        |
| `createdAt`     | Date                                                        | Creation timestamp                             |
| `updatedAt`     | Date                                                        | Last updated timestamp                         |

**Relations:**

- `landlordId` → `User` (role = landlord)
- One property → many tenants and payments

**Default Values:**

- `status` → `VACANT`
- `description` → `null`
- `depositAmount` → `0`

**Methods implemented:**

- `addIssue(issueData)` → adds a new issue in the issue list.
- `resolveIssue(issueId)` → marks the issue as resolved and wont be shown.

---

## 🏠 ISSUES **SUB-OBJECT** FOR PROPERTIES(`Issues`) ✅

| Field         | Type                             | Description                                             |
| ------------- | -------------------------------- | ------------------------------------------------------- |
| `id`          | UUID / ObjectId (auto-generated) | Unique identifier for each issue                        |
| `type`        | ENUM(`IssueTypesEnum`)           | Type of issue (electrical, plumbing, water, pest, etc.) |
| `description` | String                           | Optional detailed message from tenant                   |
| `reportedBy`  | FK → `User.id`                   | Tenant who raised the issue                             |
| `priority`    | ENUM(`IssuePriorityEnum`)        | Issue severity (low, medium, high)                      |
| `createdAt`   | Date                             | Timestamp when issue was raised                         |
| `isResolved`  | Boolean                          | Mark whether the issue has been resolved                |

**Default Values:**

- `isResolved` → `false`
- `priority` → `LOW`
- `createdAt` → `Date.now()`

---

## 👥 TENANT MODEL (`Tenant`) ✅

| Field           | Type                                    | Description                                     |
| --------------- | --------------------------------------- | ----------------------------------------------- |
| `id`            | UUID / ObjectId (PK)                    | Unique tenant record ID                         |
| `userId`        | FK → `User.id`                          | References the tenant's user account            |
| `propertyId`    | FK → `Property.id`                      | Property assigned to this tenant                |
| `rentStartDate` | Date                                    | Date when tenant started renting                |
| `rentEndDate`   | Date                                    | Expected end date / renewal date                |
| `isActive`      | Boolean                                 | Whether this tenant is currently renting        |
| `paymentStatus` | ENUM('paid', 'due', 'overdue')          | Current rent payment status                     |
| `accountStatus` | ENUM('active', 'inactive', 'evicted')   | Status of the tenant’s account/rental agreement |
| `kycStatus`     | ENUM('pending', 'verified', 'rejected') | Didit KYC verification status                   |
| `kycDocUrl`     | String                                  | URL to uploaded KYC document                    |
| `createdAt`     | Date                                    | Record creation timestamp                       |
| `updatedAt`     | Date                                    | Last updated timestamp                          |

**Relations:**

- `userId` → `User` (role = tenant)
- `propertyId` → `null`

---

## 🏛️ LANDLORD MODEL (`Landlord`) ✅

| Field             | Type                        | Description                      |
| ----------------- | --------------------------- | -------------------------------- |
| `id`              | UUID / ObjectId (PK)        | Landlord record ID               |
| `userId`          | FK → `User.id`              | Linked landlord user             |
| `businessName`    | String                      | Optional business or agency name |
| `earningsToDate`  | Number                      | Total accumulated earnings       |
| `totalProperties` | Number                      | Property count owned             |
| `status`          | ENUM('active', 'suspended') | Landlord account status          |
| `createdAt`       | Date                        | Creation timestamp               |
| `updatedAt`       | Date                        | Update timestamp                 |

**Relations:**

- `userId` → `User` (role = landlord)
- One landlord → many properties

**Default Values:**

- `businessName` → `null`
- `earningsToDate` → `0`
- `totalProperties` → `0`
- `status` → `ACTIVE`

---

## 🧾 ADMIN MODEL (`Admin`) (`OPTIONAL FOR MVP`)

| Field         | Type                                  | Description                                        |
| ------------- | ------------------------------------- | -------------------------------------------------- |
| `id`          | UUID / ObjectId (PK)                  | Admin record ID                                    |
| `userId`      | FK → `User.id`                        | References user with admin role                    |
| `permissions` | JSON                                  | Permissions like `manageUsers`, `approveKyc`, etc. |
| `activityLog` | JSON                                  | Log of admin actions                               |
| `lastLogin`   | Date                                  | Last login timestamp                               |
| `status`      | ENUM('active', 'inactive', 'revoked') | Admin account status                               |
| `createdAt`   | Date                                  | Creation timestamp                                 |
| `updatedAt`   | Date                                  | Update timestamp                                   |

**Relations:**

- `userId` → `User` (role = admin)
- `Admin` can manage multiple users, tenants, properties, and KYCs

---

### ✅ Summary Table

| Model      | Primary Key | References                                     | Status Field                      | Notes                                   |
| ---------- | ----------- | ---------------------------------------------- | --------------------------------- | --------------------------------------- |
| `User`     | `_id`       | —                                              | `active / inactive / suspended`   | Central identity with auth + role logic |
| `Property` | `id`        | `landlordId → User.id`                         | `vacant / occupied / maintenance` | Landlord-owned property                 |
| `Tenant`   | `id`        | `userId → User.id`, `propertyId → Property.id` | `active / evicted / inactive`     | Active rental link                      |
| `Landlord` | `id`        | `userId → User.id`                             | `active / suspended / pending`    | Financial info and properties           |
| `Admin`    | `id`        | `userId → User.id`                             | `active / revoked`                | Permissions + moderation logs           |

---
