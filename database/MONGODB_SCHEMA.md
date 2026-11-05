# MongoDB Collections

Mongoose schemas live in `backend/src/models/index.js`. They create collections and indexes automatically when the API connects to MongoDB.

- `profiles`: Supabase Auth user ID, name, email, phone, and application role.
- `addresses`: user-owned pickup addresses; profiles and addresses are scoped by the auth user ID.
- `services`, `clothingitems`: admin-configurable service and per-item prices.
- `orders`: pickup data, embedded order-time service/address/item price snapshots, totals, and status.
- `orderassignments`, `employees`: delivery task assignment and employee identity records.
- `payments`: order payment attempts, provider references, amounts, and status.
- `coupons`, `couponredemptions`: discounts and usage counts.
- `reviews`: one review per delivered order.
- `orderstatushistories`: append-only order state history.
- `notifications`: in-app customer notifications.

The booking, coupon redemption, status change, employee task update, and payment/order reconciliation paths use MongoDB sessions. Configure MongoDB Atlas or a local replica set; standalone MongoDB does not support these transactions. Database credentials belong only in `backend/.env`.

Seed the configurable catalog with:

```powershell
npm --workspace backend run seed
```
