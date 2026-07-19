# Dipali Fashion Backend Setup

GitHub Pages only hosts static files. This project now runs best as one Node app where the backend serves the website plus login, orders, reviews, admin dashboard and Razorpay APIs.

For public launch, use `PRODUCTION_SETUP.md`.

## 1. Create Razorpay Keys

1. Create/login to your Razorpay account.
2. Open Dashboard > Account & Settings > API Keys.
3. Generate Test keys first.
4. Use Live keys only after testing.

## 2. Run Backend Locally

```bash
cd backend
npm install
copy .env.example .env
npm start
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_ORIGIN=*
JWT_SECRET=use-a-long-random-secret-minimum-32-characters
ADMIN_PIN=use-private-admin-pin
DATABASE_FILE=./data/pooja-fashion.json
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

The order database file is created at:

```text
backend/data/pooja-fashion.json
```

## 3. Connect Frontend

`config.js` automatically uses the current website URL as the API URL. If you run locally, use:

```text
http://localhost:5000
```

## 4. Deploy

Deploy the full project as a Node web service. `render.yaml` is already added for Render.

Important:
- Add env variables in the hosting dashboard.
- Never upload real `.env` keys to GitHub.
- Use a persistent disk/database for orders.

## 5. Flow

1. Customer creates account in `account.html`.
2. Customer places order from checkout/cart.
3. Backend saves order in a JSON database file.
4. Razorpay creates payment order.
5. After payment, backend verifies signature and marks order as paid.
