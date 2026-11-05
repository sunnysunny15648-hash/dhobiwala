import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";
import { ensureMongo } from "../config/mongo.js";
import { Order, Payment } from "../models/index.js";
import { setPaymentStatus } from "../services/orderService.js";
import { ApiError, sendData } from "../utils/apiResponse.js";

function razorpay() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET)
    throw new ApiError(503, "Online payments are not configured.");
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}
export async function createPayment(req, res) {
  ensureMongo();
  const { order_id } = req.body;
  if (typeof order_id !== "string")
    throw new ApiError(400, "order_id is required.");
  const order = await Order.findOne({
    _id: order_id,
    customer_id: req.user.id,
  });
  if (!order) throw new ApiError(404, "Order not found.");
  if (order.payment_method !== "razorpay")
    throw new ApiError(400, "This order is not set up for online payment.");
  if (order.payment_status === "paid")
    throw new ApiError(409, "This order is already paid.");
  let payment = await Payment.findOne({
    order_id: order._id,
    payment_method: "razorpay",
    payment_status: "pending",
  });
  if (payment?.provider_order_id)
    return sendData(res, {
      payment,
      key_id: env.RAZORPAY_KEY_ID,
      provider_order_id: payment.provider_order_id,
    });
  const providerOrder = await razorpay().orders.create({
    amount: Math.round(order.total_amount * 100),
    currency: "INR",
    receipt: order.order_number,
    notes: { order_id: String(order._id) },
  });
  if (payment) {
    payment.provider_order_id = providerOrder.id;
    await payment.save();
  } else
    payment = await Payment.create({
      order_id: order._id,
      customer_id: req.user.id,
      amount: order.total_amount,
      payment_method: "razorpay",
      provider_order_id: providerOrder.id,
      payment_status: "pending",
    });
  return sendData(
    res,
    {
      payment,
      key_id: env.RAZORPAY_KEY_ID,
      provider_order_id: providerOrder.id,
    },
    201,
  );
}
export async function verifyPayment(req, res) {
  ensureMongo();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  if (
    ![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(
      (value) => typeof value === "string",
    )
  )
    throw new ApiError(400, "Payment verification fields are required.");
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET || "")
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest();
  const received = Buffer.from(razorpay_signature, "hex");
  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  )
    throw new ApiError(400, "Payment signature could not be verified.");
  const payment = await Payment.findOne({
    provider_order_id: razorpay_order_id,
    customer_id: req.user.id,
  });
  if (!payment) throw new ApiError(404, "Payment order not found.");
  if (payment.payment_status === "succeeded")
    return sendData(res, { verified: true, already_processed: true });
  const providerPayment = await razorpay().payments.fetch(razorpay_payment_id);
  if (
    providerPayment.order_id !== razorpay_order_id ||
    providerPayment.amount !== Math.round(payment.amount * 100) ||
    providerPayment.currency !== "INR"
  )
    throw new ApiError(400, "Payment details do not match this order.");
  if (providerPayment.status !== "captured")
    throw new ApiError(409, "Payment has not been captured yet.");
  payment.transaction_id = razorpay_payment_id;
  await payment.save();
  await setPaymentStatus(payment._id, "succeeded");
  return sendData(res, { verified: true });
}
export async function paymentWebhook(req, res) {
  ensureMongo();
  if (!env.RAZORPAY_WEBHOOK_SECRET)
    throw new ApiError(503, "Payment webhook is not configured.");
  const signature = req.headers["x-razorpay-signature"];
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody || Buffer.alloc(0))
    .digest();
  const received = Buffer.from(
    typeof signature === "string" ? signature : "",
    "hex",
  );
  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  )
    throw new ApiError(400, "Invalid webhook signature.");
  if (req.body?.event === "payment.captured") {
    const entity = req.body.payload?.payment?.entity;
    if (entity?.order_id && entity?.id) {
      const payment = await Payment.findOne({
        provider_order_id: entity.order_id,
      });
      if (
        payment &&
        Number(entity.amount) === Math.round(payment.amount * 100) &&
        entity.currency === "INR" &&
        payment.payment_status === "pending"
      ) {
        payment.transaction_id = entity.id;
        await payment.save();
        await setPaymentStatus(payment._id, "succeeded");
      }
    }
  }
  return res.status(200).json({ received: true });
}
