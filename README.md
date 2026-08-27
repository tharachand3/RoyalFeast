# RoyalFeast

A full-stack food ordering platform for a single restaurant brand. Customers explore
the store and its menus, load a cart, pay through Stripe Checkout, and track their
order history. Restaurant staff manage restaurants, menus, food items, and get
AI-generated summaries of what customers are saying about the place.

Built with the MERN stack, with Groq-powered AI features and Cloudinary image hosting.

## What's inside

| Capability | Details |
|---|---|
| Restaurant & menu browsing | Browse the restaurant list and open a menu organized by category |
| Cart management | Add, update, and remove menu items; cart follows a single logged-in user |
| Stripe Checkout payments | Server-side Stripe session; shipping address and delivery charge support (INR) |
| Order history | Every completed checkout creates an order tied to the account |
| AI food descriptions | Generate a description for a new food item from its name, category, and price |
| AI review summaries | Condense customer reviews for a restaurant into a short sentiment summary |
| Role-based admin panel | Admins create restaurants, menus, and food items; regular users cannot |
| Account features | Register, login, logout, password reset email, and profile updates |

## Roles

**Diners** can search restaurants, view menus, add items to the cart, check out,
and revisit past orders.

**Admins** (role on the user) get extra routes to create/delete restaurants, menu
categories, food items, and trigger the AI tools. Access is enforced on the API
side (`protect` + `authorizeRoles("admin")`), not just hidden in the UI.

## The stack

| Layer | Technology |
|---|---|
| Frontend | React, Redux Toolkit, React Router, Axios, Vite, Bootstrap 4, React Toastify |
| Backend | Node.js, Express, Mongoose (MongoDB), JWT + httpOnly cookies |
| Payments | Stripe Checkout (test & live mode) |
| Media | Cloudinary for image storage (via multer-storage-cloudinary) |
| AI | Groq API (`openai/gpt-oss-20b`) for descriptions and review summaries |
| Email | Nodemailer (Mailtrap SMTP for development) |

## How it fits together

The React app talks to the Express API through a single axios instance
(`frontend/src/utils/api.js`). In development, Vite proxies every `/api` call to
the backend on port `8080`. The backend authenticates requests with a JWT stored
in an httpOnly cookie, persists data in MongoDB, and calls Stripe, Cloudinary, and
Groq as external services.

```
React (Vite dev server :5173)
        │  /api  (proxied to :8080)
        ▼
Express API ──► MongoDB
   │    │    └── images → Cloudinary
   │    ├── Stripe Checkout (payment sessions)
   │    └── Groq API (AI description / review summary)
```

## Running it locally

Prerequisites: Node 18+, a MongoDB instance (Atlas or local), and API keys for the
features you want to exercise.

1. Clone the repository

   ```bash
   git clone https://github.com/tharachand3/RoyalFeast.git
   cd RoyalFeast
   ```

2. Start the backend

   ```bash
   cd backend
   npm install
   cp config/config.example.env config/config.env   # then fill in real values
   npm run dev
   ```

3. Start the frontend

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open http://localhost:5173

To load sample data, run `npm run seeder` from `backend/`.

## Configuration

All backend settings live in `backend/config/config.env` (gitignored — never commit
it). Copy `config.example.env` and fill in real values. The frontend needs
`frontend/.env.example`, where `VITE_API_BASE_URL` can point at a deployed backend
(defaults to `/api` for same-origin setups).

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port for the API |
| `NODE_ENV` | `DEVELOPMENT` or `PRODUCTION` (controls error verbosity, cookie flags) |
| `DB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign session tokens |
| `JWT_EXPIRE` / `JWT_EXPIRES_TIME` | Token lifetime (e.g. `90D` / `90` days) |
| `FRONTEND_URL` | Frontend origin, no trailing slash — used for CORS and Stripe return URLs |
| `STRIPE_SECRET_KEY` / `STRIPE_API_KEY` | Stripe secret and publishable keys |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary account keys |
| `GROQ_API_KEY` | Key for the Groq AI endpoint |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USERNAME` / `EMAIL_PASSWORD` | SMTP credentials (Nodemailer) |

## API surface

All endpoints are prefixed with `/api/v1`. Authenticated endpoints require the JWT
cookie; admin-only endpoints additionally check the user role.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/users/signup` | public | Create an account |
| POST | `/users/login` | public | Log in and set the session cookie |
| GET | `/users/logout` | public | Clear the session cookie |
| GET | `/users/me` | user | Current profile |
| PUT | `/users/me/update` | user | Update profile |
| PUT | `/users/password/update` | user | Change password |
| POST | `/users/forgetPassword` | public | Request password reset email |
| PATCH | `/users/resetPassword/:token` | public | Set a new password |
| GET | `/eats/stores` | public | List restaurants |
| POST | `/eats/stores` | admin | Create a restaurant |
| GET | `/eats/stores/:storeId` | public | Single restaurant detail |
| DELETE | `/eats/stores/:storeId` | admin | Remove a restaurant |
| GET | `/eats/stores/:storeId/menus` | public | Menus for one restaurant |
| POST | `/eats/stores/:storeId/menus` | admin | Create a menu category |
| PATCH | `/eats/stores/:storeId/menus/:menuId/addItem` | admin | Add a food item to a menu |
| DELETE | `/eats/stores/:storeId/menus/:menuId` | admin | Delete a menu category |
| GET | `/eats/items/:storeId` | public | Food items for a restaurant |
| POST | `/eats/item` | admin | Create a food item |
| GET / PATCH / DELETE | `/eats/item/:foodId` | public / admin / admin | Manage one food item |
| POST | `/eats/cart/add-to-cart` | user | Add an item to the cart |
| POST | `/eats/cart/update-cart-item` | user | Change an item quantity |
| DELETE | `/eats/cart/delete-cart-item` | user | Remove an item |
| GET | `/eats/cart/get-cart` | user | Fetch the current cart |
| POST | `/payment/process` | user | Create a Stripe Checkout session |
| GET | `/stripeapi` | user | Fetch the publishable Stripe key |
| POST | `/eats/orders/new` | user | Create an order after payment |
| GET | `/eats/orders/me/myOrders` | user | Order history for the logged-in user |
| GET | `/eats/orders/:id` | user | Single order detail |
| POST | `/ai/generate-food-ai` | public | Generate a food description |
| PUT | `/ai/admin/restaurants/:id/analyze` | public | Generate a review summary |

## Project layout

```
RoyalFeast/
├── backend/                # Express API
│   ├── config/             # DB connection, Cloudinary setup, env config
│   ├── controllers/        # Request handlers (auth, cart, orders, restaurants, ...)
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routers
│   ├── middlewares/        # Error handling, auth, role checks
│   ├── services/           # Groq AI integration (descriptions, review summaries)
│   ├── utils/              # JWT/cookie helpers, API features, email, error classes
│   └── server.js           # App entry point
├── frontend/               # React + Vite client
│   ├── src/components/     # UI (layout, user, cart, orders)
│   ├── src/redux/          # Redux Toolkit slices and async actions
│   ├── src/utils/          # Axios instance, helpers
│   └── vite.config.js      # Dev proxy for /api
├── .gitignore
└── DEPLOY.md               # Step-by-step production deployment guide
```

## Production notes

- Follow `DEPLOY.md` to stand up the backend and frontend, including env setup,
  HTTPS, cookie flags, and the Stripe test-to-live switch.
- In production the session cookie is set with `secure` and `sameSite=None` — the
  API must be served over HTTPS.
- Cart and order mutations now derive the user from the JWT, so a caller cannot
  edit another account's cart by passing a `userId` in the payload.

## Roadmap

- Google login and email verification
- Live order tracking and in-app notifications
- Coupon codes at checkout
- Ratings and reviews with photo uploads
- Multi-language and dark-mode support
- A native mobile app

## About the author

**K. Tharachand Chowdary** — MERN Stack Developer.

- GitHub: [tharachand3](https://github.com/tharachand3)
- Email: [tharachandchowdary@gmail.com](mailto:tharachandchowdary@gmail.com)

If you found RoyalFeast useful, a star on the repository would be appreciated.