# 🏡 Property Management System – Backend

Backend API for a **landlord–tenant property management system**, built with:

* **Node.js + Express**
* **MongoDB + Mongoose**
* **JWT authentication**
* Modular MVC structure (controllers, models, routes, middlewares)

This backend powers features like property management, tenant assignment, issue tracking, KYC verification, and (planned) payment + WhatsApp rent reminders.

**Note:** KYC verification is just a dummy verification for now, as the api's for kyc verification are paid 

---

## 📘 Documentation

All technical details are inside the `documentation` folder:

* **[MODELS.md](documentation/MODELS.md)** – all database models, fields, and relationships
* **[ROUTES.md](documentation/ROUTES.md)** – complete API route list with methods and descriptions

These two files are the source of truth for anyone contributing to the project.

---

## ✨ Features

### 👤 User Management

* Single `User` model with roles: `tenant`, `landlord`, `admin`
* JWT auth (access + refresh tokens)
* Email verification flow
* Password reset system
* Profile update + avatar upload

### 🏠 Properties

* Add, update, delete properties (landlords)
* Each property includes:

  * Rent, deposit, address
  * Status (`vacant`, `occupied`, `under_maintenance`, `inactive`)
  * List of tenant-raised issues

### 👨‍💼 Tenant Management

* Assign/unassign tenants to properties
* Tenant profile linked to property
* Track rent status, KYC status, and active/inactive status
* KYC verification endpoints included

### 🧾 Issues (Maintenance)

* Tenants can raise property issues (water, electrical, plumbing, etc.)
* Track priority + resolution

### 💰 Payments (Planned)

* Payment initiation + confirmation
* Rent payment history
* Automatic monthly WhatsApp reminders

### 🛠 Admin Tools (Optional)

* View/manage users
* Approve KYC requests
* Delete users

---

## 📁 Project Structure

```
server/
├── documentation/
│   ├── MODELS.md
│   └── ROUTES.md
│
├── public/                # Static files (if needed)
├── src/
│   ├── controllers/       # Route logic
│   ├── db/                # MongoDB connection
│   ├── middlewares/       # Auth, role checks, error handler
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routes
│   ├── utils/             # Helpers (tokens, email, etc.)
│   └── validators/        # Joi/Yup validation schemas
│
├── app.js                 # Express app
├── index.js               # Server entry point
├── package.json
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/NallyTHEdude/TMS_Server.git
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Environment Variables

Copy `.env.example` and rename the file as `.env` and fill in the below fields :

```env
PORT=

#("https://example.com, http://localhost:3000")
CORS_ORIGIN=

MONGO_URI=

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=

REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=

MAILTRAP_SMTP_HOST=
MAILTRAP_SMTP_PORT=
MAILTRAP_SMTP_USERNAME=
MAILTRAP_SMTP_PASSWORD=

RESET_PASSWORD_REDIRECT_URL=


CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 4️⃣ Run the server

```bash
npm run dev
```

Server will start at:

```
http://localhost:<PORT>
```

Test with:

```
GET /api/v1/health
```

---

## 🧱 Tech Used

* **Node.js**
* **Express.js**
* **MongoDB + Mongoose**
* JWT authentication
* Nodemailer (for email)
* Multer / Cloudinary Cloud storage (for avatars or documents)

---

## 🧭 Development Guidelines

* Update [MODELS.md](documentation/MODELS.md) and [MODELS.md](documentation/ROUTES.md) whenever you add or modify anything.
* ✅ represents that the feature is implimented successfully and tested in postman, empty fields in status represent todo features.
* PATCH routes from the documentations are interchangable with put routes, **using PUT request instead of PATCH request is highly encouraged**
* Use validators for every POST/PATCH route.
* Follow role-based middleware for tenant/landlord/admin routes.
* Avoid mixing business logic inside route files; always use controllers.

---

## 🤝 Contributing (For collaborators)

1. Fork repo
2. Create branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open PR

---