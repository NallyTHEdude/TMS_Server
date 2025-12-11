# 🏡 Property Management System – Backend

Backend API for a **landlord–tenant property management system**, built with:

* **Node.js + Express**
* **MongoDB + Mongoose**
* **JWT authentication**
* Modular MVC structure (controllers, models, routes, middlewares)

This backend powers features like property management, tenant assignment, issue tracking, KYC verification, and (planned) payment + WhatsApp rent reminders.

**Note:** KYC verification is just a dummy verification for now, as the APIs for KYC verification are paid or require organizational access.

---

## 📘 Documentation

All technical details are inside the `documentation` folder:

* **[MODELS.md](documentation/MODELS.md)** – all database models, fields, and relationships

* **[ROUTES.md](documentation/ROUTES.md)** – complete API route list with methods and descriptions

* ✅ represents that the feature is implemented successfully and tested in Postman.

* Empty fields represent TODO features.

* PATCH routes from the documentation are interchangeable with PUT routes — **using PUT is highly encouraged**.

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
* Rent, deposit, address fields
* Status: `vacant`, `occupied`, `under_maintenance`, `inactive`
* List of tenant-raised issues

### 👨‍💼 Tenant Management

* Assign/unassign tenants
* Tenant profile linked to property
* Track rent status, KYC status, active/inactive status
* KYC verification endpoints included

### 🧾 Issues (Maintenance)

* Tenants can raise property issues (water, electrical, plumbing, etc.)
* Track issue priority + resolution

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
├── public/
├── src/
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── validators/
│
├── app.js
├── index.js
├── package.json
├── .env.example
└── README.md
```

---

## 🚀 Getting Started (Without Docker)

### 1️⃣ Clone the repository

```bash
git clone https://github.com/NallyTHEdude/TMS_Server.git
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Environment Variables

Copy `.env.example` as `.env` and fill all values:

```bash
cp .env.example .env
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

## 🐳 Running with Docker

This project includes a production-ready Dockerfile.
Follow the steps below to build and run the backend inside a Docker container.

### 1️⃣ Create your `.env` file

```bash
cp .env.example .env
```

Fill in all required values (MongoDB URI, JWT secrets, Cloudinary keys, etc.).

---

### 2️⃣ Build the Docker image

```bash
docker build -t tms-server .
```

---

### 3️⃣ Run the container

```bash
docker run -p 4000:4000 tms-server
```

Backend will be available at:

```
http://localhost:4000
```

---

### 🔒 (Optional) Run using `.env` safely

```bash
docker run -p 4000:4000 --env-file .env tms-server
```

Recommended for real deployments since `.env` is not baked into the image.

---

### 🧹 Useful Docker commands

Stop container:

```bash
docker stop <container>
```

Remove container:

```bash
docker rm <container>
```

View logs:

```bash
docker logs <container>
```

---

## 🧱 Tech Used

* Node.js
* Express.js
* MongoDB + Mongoose
* JWT authentication
* Nodemailer
* Multer + Cloudinary

---

## 🧭 Development Guidelines

* Update MODELS.md and ROUTES.md when adding/modifying features.
* Use validators for every POST/PATCH route.
* Use role-based middleware for tenant/landlord/admin routes.
* Keep controllers separate from route files.
* PUT is preferred over PATCH in this project.

---
