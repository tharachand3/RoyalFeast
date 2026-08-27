# Deployment Guide — FoodGenApp (MERN)

This guide takes the app from `localhost` to a real URL. It assumes two deployments:
a **backend API** (Node/Express + MongoDB Atlas + Cloudinary + Stripe + Groq) and a
**frontend** (static React build, served by Vercel/Netlify or nginx).

> Secrets live only in `backend/config/config.env` (gitignored) for local dev.
> In production use your host's **environment variables** — never commit secrets.

---

## 1. Preflight checklist (already applied in `main`)

- [x] Stripe secret is no longer logged (`paymentController.js`)
- [x] PII/logs removed from payment/order controllers
- [x] `castError` typo fixed in production error handler
- [x] CORS normalizes trailing slashes on `FRONTEND_URL`
- [x] Production cookies set `secure` + `sameSite=None` (HTTPS required)
- [x] Cart mutation routes require login and derive `userId` from the JWT (no IDOR)
- [x] Frontend API base URL is configurable via `VITE_API_BASE_URL`

Required env var reference: `backend/config/config.example.env` and
`frontend/.env.example`.

---

## 2. Backend — pick a host (Render or Railway recommended)

Example: **Render** (https://render.com)

1. Create a new **Web Service**, point it at your repo + `backend/` directory.
2. Build command: `npm install`
3. Start command:
   ```
   node server.js
   ```
   (Set `NODE_ENV=PRODUCTION`, `PORT=8080` in the env panel — do **not** use the
   `npm run prod` script on Unix hosts; `SET` is a Windows-ism.)
4. Add every variable from `backend/config/config.example.env` **except** `NODE_ENV`
   and `PORT`, plus:
   - `FRONTEND_URL` = your final frontend URL, **no trailing slash**
     (e.g. `https://foodgen.pages.dev`)
   - `DB_URI` = your MongoDB Atlas connection string
   - `STRIPE_SECRET_KEY` / `STRIPE_API_KEY` = **live** values (not `sk_test_*`)
   - `GROQ_API_KEY`, `CLOUDINARY_*`, `JWT_SECRET` (long random string)
5. Deploy. Note the service URL, e.g. `https://foodgen-api.onrender.com`.

### Cookie / auth notes

- The app stores its session in an `httpOnly` cookie. In production the cookie is
  `secure` + `sameSite=None`, so the backend **must** be served over HTTPS (any host
  gives this for free). Never disable HTTPS or auth cookies will be dropped.
- If your backend and frontend end up on the **same domain** (nginx reverse proxy,
  Railway+proxy), you can relax the cookie to `sameSite=lax` by setting
  `NODE_ENV`-gated logic — but `secure` must stay on.

---

## 3. Frontend — build with the right API URL

1. Make a `.env.production` in `frontend/` (or add to the host's env panel):

   ```
   VITE_API_BASE_URL=https://foodgen-api.onrender.com
   ```

   > If you serve the frontend **and** backend behind one domain (e.g. nginx proxies
   > `/api` to the backend), leave `VITE_API_BASE_URL` empty so the app uses `/api`.

2. Build:

   ```
   npm run build    # outputs frontend/dist
   ```

3. Deploy `frontend/dist`:
   - **Vercel**: Static build → output dir `dist`
   - **Netlify**: Build command `npm run build`, publish dir `dist`
   - **nginx/Apache**: upload `dist` to the web root

---

## 4. Same-origin proxy option (no CORS in play)

If you control a VPS / one domain, this is the cleanest topology:

```
https://yourdomain.com          -> serves frontend/dist
https://yourdomain.com/api/*    -> reverse proxy to 127.0.0.1:8080
```

nginx example:

```nginx
server {
  listen 443 ssl;
  server_name yourdomain.com;

  root /var/www/foodgen/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }
}
```

With this setup, `VITE_API_BASE_URL` stays empty and CORS is irrelevant (same origin).
Run the backend under PM2: `pm2 start server.js --name foodgen`.

---

## 5. Post-deploy verification

1. `GET https://<api>/api/v1/eats/stores` → returns JSON (backend up + DB connected).
2. Create crops/restaurants/food via the admin UI, upload an image → Cloudinary works.
3. Buy something: Stripe test mode → hits `success?session_id=...`, order created in DB.
4. Generate an AI description + AI review summary → Groq key works.
5. Log in, refresh the page → still logged in (cookie survives).

### Stripe: switch from test to live

- In `config/env panel`, replace `sk_test_*` / `pk_test_*` with live keys.
- Re-run a full checkout to confirm webhooks/success pages behave with real cards.

---

## 6. Maintenance tips

- **MongoDB Atlas**: enable backups; whitelist only your app host's IPs.
- **Logs**: after deploy, run a quick `grep -ri "console\." backend/` and strip any
  remaining debug output you don't want in production.
- **Dependencies**: `npm audit` in both `backend/` and `frontend/` before go-live.
- **Secrets**: if `config.env` ever leaks (e.g. pushed to a public repo that was
  cloned by someone else), rotate ALL keys immediately — DB password, Stripe, Cloudinary,
  Groq, JWT secret.