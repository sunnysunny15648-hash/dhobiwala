# Deployment Guide

## 1. MongoDB Atlas

1. Create a MongoDB Atlas cluster and database user. Allow the application host's IP (or a suitable production network range) in Network Access.
2. Copy the application connection string and configure it as Render's `MONGODB_URI`. URL-encode special characters in the database password. Set `MONGODB_DB_NAME=dhobi_wala`.
3. Atlas runs as a replica set, which is required for transactional orders, coupon redemption, payment updates, and employee task transitions.
4. Mongoose creates collections and indexes from `backend/src/models/index.js` when the service connects. Seed the catalog with `npm --workspace backend run seed` from a one-off Render shell or a trusted local connection.
5. Back up MongoDB and use a least-privilege database user. Never expose the URI to the frontend.

## 2. Supabase Auth (Identity Only)

1. Create a Supabase project and enable the Email provider.
2. Configure allowed redirect URLs for the deployed frontend's `/login` route.
3. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` on the backend. The backend uses them to register/login/refresh and verify access tokens.
4. `SUPABASE_SERVICE_ROLE_KEY` is only required for admin Auth operations such as creating employee identities and setting a user's password. Keep it on Render only. Supabase Postgres and RLS are not used for app data.
5. MongoDB profiles store the app role. Register normally, then promote the first admin from a trusted backend shell with `npm --workspace backend run promote-admin -- admin@example.com`.

## 3. Backend on Render

1. Create a Web Service from the repository with the repository root as its build context so npm workspaces can resolve the lockfile.
2. Build command: `npm install`. Start command: `npm run start --workspace backend`.
3. Add `NODE_ENV=production`, Render's `PORT`, `FRONTEND_URL=https://your-frontend-domain`, `MONGODB_URI`, `MONGODB_DB_NAME`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY`.
4. Add Supabase service-role and Razorpay keys only when those administrative/payment operations are enabled.
5. Use `/health` as the health-check path.

## 4. Frontend on Vercel

1. Import the repository. Use repository root so npm workspaces resolve correctly.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `frontend/dist`.
3. Set `VITE_API_URL=https://your-render-service/api`. No database URI or Supabase keys go in frontend variables.
4. Add SPA rewrites if Vercel does not automatically route React Router paths back to `index.html`.
5. Set Render `FRONTEND_URL` to the exact production frontend origin and redeploy the API.

## 5. Razorpay

Use test keys first. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` as Render environment secrets. Configure `https://your-render-service/api/payments/webhook` for `payment.captured`. Verify successful/failed test payments, duplicate callbacks, and signature rejection before enabling live keys.

## Production Checklist

- Never commit `.env` files or log secret values.
- Use HTTPS for frontend, API, and payment callbacks.
- Keep MongoDB URI, Supabase service-role key, and Razorpay secrets on Render only.
- Restrict MongoDB network access and credentials to the application.
- Confirm CORS has only the production frontend origin.
- Test customer ownership, admin-only operations, and employee assignment isolation with separate accounts.
- Monitor Render logs and Atlas usage; configure backups and alerting.
- Add privacy policy, terms, support contact, and operational service area before accepting real bookings.
