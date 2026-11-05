# Dhobi Wala

A full-stack doorstep laundry platform with a React/Vite customer app, Express REST API, and MongoDB persistence. Supabase is retained only for email/password identity and token verification; all application records (profiles, orders, addresses, catalog, payments, assignments, coupons, reviews, status history, notifications) live in MongoDB.

## Architecture

```text
frontend (React + Vite)
  -> REST API (Express, Zod)
     -> MongoDB Atlas / replica set via Mongoose (all app data)
     -> Supabase Auth (identity only; no Postgres tables or RLS)
     -> Razorpay (optional payments; server-side verification)
```

Prices, ownership, role checks, order transitions, payment state, coupon use, and pickup capacity are controlled by the API. Critical booking/status operations use MongoDB transactions. Use MongoDB Atlas or a replica-set deployment; standalone MongoDB does not support transactions.

## Project Structure

```text
frontend/
  src/components/       Shared brand and workspace shell
  src/context/          Authentication state
  src/pages/            Landing, catalog, login, booking, customer/admin/employee screens
  src/services/         REST client
backend/
  src/config/           Environment, MongoDB, and Supabase Auth clients
  src/models/           Mongoose schemas and indexes
  src/controllers/      REST handlers
  src/middleware/       Authentication, role checks, validation, errors
  src/routes/           API route groups
  src/services/         Transactional orders and notifications
  src/scripts/          Catalog seed and admin promotion commands
  test/                 Backend unit tests
database/
  MONGODB_SCHEMA.md     Collections, indexes, and seed notes
docs/
  API_DOCUMENTATION.md
  DEPLOYMENT.md
```

## Requirements

- Node.js 20 LTS or newer and npm
- MongoDB Atlas (recommended) or a local MongoDB replica set
- Supabase project for Auth only: Email provider, project URL, anon key; service-role key only for admin Auth operations
- Razorpay test credentials only if online checkout is to be enabled

## Local Setup

1. Install dependencies from the project root:

   ```powershell
   npm install
   ```

2. Create a MongoDB Atlas cluster. Allow your development IP in Network Access, create a database user, and copy the connection string. Replace its username/password placeholders; URL-encode special characters in the password.
3. Create a Supabase project and enable Email authentication. In the Supabase API settings, copy the project URL and anon key to `backend/.env`; add the service-role key only if you need admin employee account creation/password administration. Supabase Postgres is not used.
4. Put your Mongo connection string in `backend/.env` as `MONGODB_URI` and keep `MONGODB_DB_NAME=dhobi_wala`. Keep all credentials in backend `.env`, never the frontend.
5. Seed the live catalog:

   ```powershell
   npm --workspace backend run seed
   ```

6. Start the frontend and API together:

   ```powershell
   npm run dev
   ```

   Open `http://localhost:5173`. API health is at `http://localhost:5000/health`.

The API can start with empty credentials for UI work, but authentication/data routes require MongoDB and Supabase Auth settings. A MongoDB replica set/Atlas deployment is required for transactional bookings.

## First Admin

Register and confirm the account through the app, then run:

```powershell
npm --workspace backend run promote-admin -- your-admin-email@example.com
```

Sign out and back in so the API reloads the MongoDB role. Admins can create delivery employees from the Team workspace. No admin credential is hardcoded.

## Razorpay Test Mode

Add the Razorpay test `KEY_ID`, `KEY_SECRET`, and webhook secret to `backend/.env`. Configure the webhook URL as `https://your-api-host/api/payments/webhook` and subscribe to `payment.captured`. The API verifies signatures and fetches provider payment state before marking orders paid.

## Checks

```powershell
npm run check
npm run build
npm audit --omit=dev
```

The check runs backend syntax checks, focused unit tests, and a production Vite build. End-to-end auth, Mongo transaction, email, and payment workflows require configured external test accounts and should be tested in sandbox environments.

## Environment Files

- `backend/.env.example`: MongoDB URI/database name, Supabase Auth credentials, API settings, and optional Razorpay keys.
- `frontend/.env.example`: API URL only.
- `.env` files are ignored by Git. Never commit real keys.

See [MongoDB collections](database/MONGODB_SCHEMA.md), [API documentation](docs/API_DOCUMENTATION.md), and the [deployment guide](docs/DEPLOYMENT.md).
