# Pooja Fashion Production Setup

This project is ready to run as one Node app: the backend serves the website files and the API.

## Before Launch

Do not upload real secrets to GitHub. Add secrets only in the hosting dashboard.

Required production environment variables:

```env
NODE_ENV=production
PORT=5000
FRONTEND_ORIGIN=*
DATABASE_FILE=/var/data/pooja-fashion.json
JWT_SECRET=use-a-long-random-secret-minimum-32-characters
ADMIN_PIN=use-a-private-pin-minimum-6-digits
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_live_secret
```

## Deploy On Render

1. Push the project to GitHub.
2. Open Render and create a new Blueprint from this repo.
3. Render will read `render.yaml`.
4. Add the secret values when Render asks for `JWT_SECRET`, `ADMIN_PIN`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`.
5. After deploy, open:

```text
https://your-render-site.onrender.com/api/health
```

Expected response:

```json
{"ok":true,"service":"Pooja Fashion API"}
```

## Live Payment

Use Razorpay Test keys first. After testing checkout successfully, switch to Live keys from Razorpay Dashboard.

The public website never stores the Razorpay secret. The backend reads it from hosting environment variables.

## Admin Orders

Open:

```text
https://your-render-site.onrender.com/admin.html
```

Enter the production `ADMIN_PIN`. The dashboard shows customer name, mobile number, address, products, quantity, size, payment status, and map link.

## Maintenance

- Download/backup `/var/data/pooja-fashion.json` regularly.
- Check `/api/health` after every deploy.
- Keep Razorpay keys private.
- Change `ADMIN_PIN` if someone else gets it.
- Do not commit `.env`, `backend/data`, or log files.
