# API Documentation

Base URL: `http://localhost:5000/api`. Responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "message": "..." }`. Protected requests use a Supabase Auth access token in `Authorization: Bearer <token>`. Supabase is only the identity provider; all application records are stored in MongoDB through Mongoose. Privileged endpoint ownership and role checks are enforced in the API.

## Health and Authentication

- `GET /health`: API process health.
- `POST /auth/register`: `{ full_name, email, phone, password }`; registers through Supabase Auth and creates the profile document in MongoDB.
- `POST /auth/login`: `{ email, password }`; returns Supabase access/refresh tokens and the MongoDB profile role.
- `POST /auth/logout`: protected; client removes its stateless tokens.
- `GET /auth/me`: validates the Supabase token, then loads the role/profile from MongoDB.
- `POST /auth/refresh`: `{ refresh_token }`; exchanges a valid Supabase refresh token.
- `POST /auth/password-reset`: `{ email }`; sends a Supabase Auth recovery email.
- `PUT /auth/password`: `{ password }`; updates the authenticated Supabase Auth user. Requires the backend Auth admin key.

## Customer

- `GET /users/profile`, `PUT /users/profile`: MongoDB profile operations; update `full_name` and/or `phone`.
- `GET /users/addresses`, `POST /users/addresses`, `PUT /users/addresses/:addressId`, `DELETE /users/addresses/:addressId`: owner-scoped MongoDB addresses.
- `GET /services`, `GET /services/:serviceId`: active MongoDB service catalog.
- `GET /clothing-items`: active MongoDB item prices.
- `POST /orders`: `{ service_id, address_id, pickup_date, pickup_slot, payment_method, special_instructions, coupon_code?, items: [{ clothing_item_id, quantity }] }`. Price snapshots, coupon redemption, payment placeholder, order, and status history are saved transactionally using server-side MongoDB catalog prices. Pickup windows hold up to 10 orders.
- `GET /orders`, `GET /orders/:orderId`, `GET /orders/:orderId/tracking`: owner-scoped MongoDB orders and status history.
- `PUT /orders/:orderId/cancel`: customer can cancel before collection only.
- `POST /payments/create`: `{ order_id }`; creates/reuses an online Razorpay order.
- `POST /payments/verify`: Razorpay callback payload; HMAC and provider status/amount are verified server-side.
- `POST /reviews`: `{ order_id, rating, comment }`; only the owner of a delivered order can review it.
- `GET /reviews`: latest customer reviews.
- `GET /coupons`: active MongoDB coupons.
- `POST /coupons/validate`: `{ code, subtotal }`; validates coupon availability. Order creation recalculates and redeems it transactionally.
- `GET /notifications`, `PATCH /notifications/:notificationId/read`: current user's MongoDB in-app notifications.

## Admin

All `/admin` routes require a MongoDB profile with role `admin`.

- `GET /admin/dashboard`: MongoDB customer/order counts and paid revenue.
- `GET /admin/orders?status=&search=&from=&to=`: order queue with MongoDB profile/address details.
- `GET /admin/customers`: customer directory.
- `GET /admin/employees`, `POST /admin/employees`: list employees or create a Supabase Auth employee identity plus MongoDB profile/employee records. Creation requires `{ full_name, email, phone, password }` with a 10+ character password and backend Auth admin credentials.
- `PATCH /admin/orders/:orderId/assign`: `{ employee_id, assignment_type: "pickup" | "delivery" }`.
- `GET /admin/payments`, `PATCH /admin/payments/:paymentId`: payment records and valid status transitions.
- `GET /admin/reports?period=week|month|year`: MongoDB order totals, paid revenue, and popular service snapshots.
- `POST /services`, `PUT /services/:serviceId`, `DELETE /services/:serviceId`: create/update/deactivate MongoDB services.
- `PATCH /clothing-items/:itemId`: update item name, description, active state, or price.
- `PATCH /orders/:orderId/status`: `{ order_status }`; transition history and notifications are stored in MongoDB.
- `POST /coupons`: create a MongoDB coupon.

## Delivery Employee

All `/employee` routes require an employee role and return only that employee's assigned MongoDB tasks.

- `GET /employee/tasks`, `GET /employee/tasks/:taskId`: assigned pickup/delivery work.
- `PATCH /employee/tasks/:taskId/status`: `{ status, delivery_confirmed }`. Delivery requires confirmation; assignment ownership and valid status transitions are checked inside a MongoDB transaction.

## Database Notes

MongoDB transactions need a replica set, so use MongoDB Atlas or configure a local replica set. Mongoose creates schema indexes at startup. See [MongoDB collections and seed](../database/MONGODB_SCHEMA.md).
