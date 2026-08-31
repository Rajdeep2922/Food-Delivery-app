# ForkLane 🍴

> **Good Food. No Wait.** — A full-stack MERN food delivery application.

---

## Project Structure

```
forklane/
├── backend/     Node.js + Express + MongoDB API (port 5000)
├── client/      Customer storefront — React 18 + Vite  (port 5173)
└── admin/       Admin panel — React 18 + Vite           (port 5174)
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, STRIPE_SECRET_KEY, ADMIN_REGISTER_SECRET
npm install
npm run dev
```

### 2. Seed the database (optional)

```bash
cd backend
# Add SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to your .env first
npm run seed
```

### 3. Customer Frontend

```bash
cd client
cp .env.example .env
# Fill in VITE_STRIPE_PUBLISHABLE_KEY
npm install
npm run dev
# → http://localhost:5173
```

### 4. Admin Panel

```bash
cd admin
cp .env.example .env
npm install
npm run dev
# → http://localhost:5174
```

---

## Environment Variables

### `backend/.env`

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRE` | JWT expiry (default: 7d) |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_...) |
| `ADMIN_REGISTER_SECRET` | Secret to register admin accounts |
| `CLIENT_URL` | Customer frontend URL for CORS |
| `ADMIN_URL` | Admin panel URL for CORS |

### `client/.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_test_...) |

---

## API Endpoints

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register customer |
| POST | `/api/auth/register-admin` | Public (+ secret) | Register admin |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/profile` | Protected | Get user profile |
| PUT | `/api/auth/profile` | Protected | Update profile |

### Products
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/products` | Public | List (with `?category=` `?search=`) |
| GET | `/api/products/:id` | Public | Get single product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| POST | `/api/products/upload-image` | Admin | Upload image |

### Orders
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/orders` | User | Create order |
| GET | `/api/orders/my` | User | My orders |
| GET | `/api/orders/:id` | User/Admin | Order details |
| PUT | `/api/orders/:id/confirm-payment` | User | Verify Stripe payment |
| GET | `/api/orders` | Admin | All orders (`?status=`) |
| PUT | `/api/orders/:id/status` | Admin | Advance order status |
| PUT | `/api/orders/:id/cancel` | Admin | Cancel with reason |

### Dashboard
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | Admin | Dashboard statistics |

---

## Registering an Admin

```bash
curl -X POST http://localhost:5000/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@forklane.com",
    "password": "yourpassword",
    "adminSecret": "your_ADMIN_REGISTER_SECRET_value"
  }'
```

---

## Order Lifecycle

```
PLACED → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED
                                                         ↓
                                               (COD: paymentStatus = PAID)

Any status → CANCELLED (requires reason; Stripe refund attempted if paid)
```

---

## Design System

- **Fonts**: Inter (UI) + Bebas Neue (hero headlines)
- **Colors**: Ink `#111111` / Canvas `#fff` / Soft Cloud `#f5f5f5`
- **Buttons**: Pill-shaped, black/white/gray only
- **Cards**: Flat, no shadows, no gradients
- **Spacing**: 8px rhythm

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, MongoDB, Mongoose |
| Authentication | JWT + bcryptjs |
| Payments | Stripe |
| File upload | Multer |
| Customer frontend | React 18, Vite, React Router v6 |
| Admin frontend | React 18, Vite, React Router v6 |
| State management | React Context API |
| HTTP client | Axios |
| Notifications | react-hot-toast |
