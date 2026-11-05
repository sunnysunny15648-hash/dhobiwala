import test from "node:test";
import assert from "node:assert/strict";
import { calculatePrice } from "../src/utils/calculatePrice.js";
import { generateOrderId } from "../src/utils/generateOrderId.js";
import { createOrderSchema } from "../src/validators/orderValidator.js";
import mongoose from "mongoose";
import { Address, Order, Service } from "../src/models/index.js";
import { sendData } from "../src/utils/apiResponse.js";

const serviceId = "c0a80123-4567-489a-8abc-123456789012";
const addressId = "c0a80123-4567-489a-8abc-123456789013";
const itemId = "c0a80123-4567-489a-8abc-123456789014";

test("calculates clothing lines from the database catalog, not client prices", () => {
  const amount = calculatePrice(
    [{ clothing_item_id: itemId, quantity: 3 }],
    [{ id: itemId, price: "15.00", is_active: true }],
  );
  assert.equal(amount, 45);
});

test("rejects inactive or unknown clothing items", () => {
  assert.throws(
    () =>
      calculatePrice(
        [{ clothing_item_id: itemId, quantity: 1 }],
        [{ id: itemId, price: 15, is_active: false }],
      ),
    /unavailable/,
  );
});

test("generates order references with a date and random suffix", () => {
  assert.match(generateOrderId(), /^DW\d{12}$/);
});

test("validates booking items and pickup windows", () => {
  const valid = createOrderSchema.safeParse({
    body: {
      service_id: serviceId,
      address_id: addressId,
      pickup_date: "2027-01-02",
      pickup_slot: "10 AM – 12 PM",
      payment_method: "cod",
      items: [{ clothing_item_id: itemId, quantity: 2 }],
    },
  });
  assert.equal(valid.success, true);
  const invalid = createOrderSchema.safeParse({
    body: {
      service_id: serviceId,
      address_id: addressId,
      pickup_date: "2027-01-02",
      pickup_slot: "midnight",
      items: [{ clothing_item_id: itemId, quantity: -1 }],
    },
  });
  assert.equal(invalid.success, false);
});

test("Mongo service schema rejects a negative price", async () => {
  const service = new Service({
    name: "Bad service",
    price: -1,
    estimated_hours: 5,
  });
  await assert.rejects(service.validate(), /price/);
});

test("Mongo address schema requires a six digit pincode", async () => {
  const address = new Address({
    user_id: "auth-user",
    address_line: "1 Main Road",
    city: "Pune",
    pincode: "123",
  });
  await assert.rejects(address.validate(), /pincode/);
});

test("Mongo order schema rejects an invalid state", async () => {
  const order = new Order({
    order_number: "DWTEST000001",
    customer_id: "auth-user",
    address_id: new mongoose.Types.ObjectId(),
    pickup_date: "2027-01-02",
    pickup_slot: "10 AM – 12 PM",
    service_id: new mongoose.Types.ObjectId(),
    subtotal: 10,
    total_amount: 10,
    payment_method: "cod",
    order_status: "teleporting",
    service_snapshot: { name: "Wash", price: 10 },
    address_snapshot: { city: "Pune" },
  });
  await assert.rejects(order.validate(), /order_status/);
});

test("API serialization preserves REST id and timestamp names for Mongo records", () => {
  let response;
  const res = {
    status() {
      return this;
    },
    json(value) {
      response = value;
      return value;
    },
  };
  const id = new mongoose.Types.ObjectId();
  sendData(res, {
    order: {
      _id: id,
      createdAt: new Date("2027-01-01T00:00:00.000Z"),
      name: "Wash",
    },
  });
  assert.equal(response.data.order.id, String(id));
  assert.equal(response.data.order.created_at, "2027-01-01T00:00:00.000Z");
  assert.equal(response.data.order.name, "Wash");
});
