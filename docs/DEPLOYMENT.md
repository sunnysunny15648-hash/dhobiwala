# Deployment Guide

## 1. MongoDB Atlas

1. Create a MongoDB Atlas cluster and database user. Allow the application host's IP (or a suitable production network range) in Network Access. Atlas hosts the database; it is not deployed to Vercel.
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

1. In Render, choose **New → Blueprint** and connect `sunnysunny15648-hash/dhobiwala`. Render reads the checked-in `render.yaml` at the repository root.
2. Set the prompted `MONGODB_URI` to the Atlas connection string; set `FRONTEND_URL` to the eventual Vercel site origin. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` for sign-in. The service-role key is only needed for admin Auth operations and stays on Render.
3. Render uses `npm install`, `npm run start --workspace backend`, and `/health/ready` from the Blueprint. It supplies `PORT` automatically. `/health` is a liveness check; `/health/ready` confirms MongoDB and Supabase Auth configuration.
4. After the service is live, run `npm --workspace backend run seed` from a trusted local connection or a Render shell to add the initial service and clothing catalog.

## 4. Frontend on Vercel

1. In Vercel, choose **Add New → Project** and import `sunnysunny15648-hash/dhobiwala`.
2. Set **Root Directory** to `.` (the repository root), not `frontend`, so the npm workspace and root lockfile are used.
3. Use Framework Preset **Vite**. The checked-in `vercel.json` sets install command `npm install`, build command `npm run build`, output directory `frontend/dist`, and React Router SPA fallback.
4. In **Project Settings → Environment Variables**, add `VITE_API_URL` with the full Render API URL, for example `https://your-render-service.onrender.com/api`. Add it to Production (and Preview if desired), then redeploy. Do not put MongoDB or Supabase service-role credentials in Vercel; the frontend calls the API for data/auth.
5. After Vercel assigns a domain, set Render's `FRONTEND_URL` to that exact origin, such as `https://dhobiwala.vercel.app`, then redeploy the backend so CORS allows the frontend.
6. In Supabase **Authentication → URL Configuration**, add the Vercel URL to the redirect allowlist for password recovery. Supabase is used for Auth only.
7. Test the homepage, `/login`, and a direct deep link such as `/services`; verify the API health endpoint and browser Network panel for API requests.

## Connection Order

1. Create Atlas and keep the MongoDB URI private.
2. Import the repo into Vercel and deploy once to obtain the assigned frontend domain. The UI can build without `VITE_API_URL`, but API-backed features will not work yet.
3. Create the Render Blueprint service. Enter the Atlas URI, Supabase Auth values, and the Vercel domain as `FRONTEND_URL`; copy the Render service URL after it is live.
4. Add `VITE_API_URL=https://<render-service>.onrender.com/api` to Vercel and redeploy the frontend.
5. If you later change the Vercel domain, update Render `FRONTEND_URL` to the exact new origin and redeploy the backend.

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
