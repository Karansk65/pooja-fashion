# Dipali Fashion Production Setup

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

## Custom Domain: poojafashionstore.com

Your live store URL will be:

```text
https://poojafashionstore.com
```

### Connect Domain On Render

1. Deploy the app on Render first and confirm `https://your-render-site.onrender.com/api/health` returns `ok: true`.
2. In Render, open your web service.
3. Go to **Settings** -> **Custom Domains**.
4. Add `poojafashionstore.com`.
5. Add `www.poojafashionstore.com` as well.
6. Render will show DNS records. Add them at your domain registrar (where you bought the domain).

Typical DNS setup:

| Type | Name | Value |
|------|------|-------|
| CNAME | `www` | your Render hostname (example: `pooja-fashion.onrender.com`) |
| A or ALIAS | `@` | Render root domain IP or ALIAS target shown in dashboard |

DNS can take 15 minutes to 48 hours to update.

### After Domain Is Live

1. Open `https://poojafashionstore.com/api/health` and confirm it works.
2. Open `https://poojafashionstore.com` and test cart, login, and checkout.
3. In Razorpay Dashboard, add `poojafashionstore.com` and `www.poojafashionstore.com` to allowed domains for live payments.
4. Optional: set `FRONTEND_ORIGIN` in Render to `https://poojafashionstore.com` if you want stricter CORS.

## Deploy On Render

1. Push the project to GitHub.
2. Open Render and create a new Blueprint from this repo.
3. Render will read `render.yaml`.
4. Add the secret values when Render asks for `JWT_SECRET`, `ADMIN_PIN`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`.
5. After deploy, open:

```text
https://poojafashionstore.com/api/health
```

If the custom domain is not connected yet, use:

```text
https://your-render-site.onrender.com/api/health
```

Expected response:

```json
{"ok":true,"service":"Dipali Fashion API"}
```

## Live Payment

Use Razorpay Test keys first. After testing checkout successfully, switch to Live keys from Razorpay Dashboard.

The public website never stores the Razorpay secret. The backend reads it from hosting environment variables.

## Admin Orders

Open:

```text
https://poojafashionstore.com/admin.html
```

If the custom domain is not connected yet, use your Render URL instead.

Enter the production `ADMIN_PIN`. The dashboard shows customer name, mobile number, address, products, quantity, size, payment status, and map link.

## Maintenance

- Download/backup `/var/data/pooja-fashion.json` regularly.
- Check `/api/health` after every deploy.
- Keep Razorpay keys private.
- Change `ADMIN_PIN` if someone else gets it.
- Do not commit `.env`, `backend/data`, or log files.
