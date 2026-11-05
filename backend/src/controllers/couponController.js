import { Coupon } from "../models/index.js";
import { ensureMongo } from "../config/mongo.js";
import { ApiError, sendData } from "../utils/apiResponse.js";

const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
export async function getCoupons(_req, res) {
  ensureMongo();
  const coupons = await Coupon.find({
    is_active: true,
    expiry_date: { $gte: today() },
    $expr: {
      $or: [
        { $eq: ["$usage_limit", null] },
        { $lt: ["$usage_count", "$usage_limit"] },
      ],
    },
  })
    .select("-usage_count")
    .sort({ createdAt: -1 })
    .lean();
  return sendData(res, { coupons });
}
export async function createCoupon(req, res) {
  ensureMongo();
  const body = req.body;
  if (
    typeof body.code !== "string" ||
    !["percentage", "fixed"].includes(body.discount_type) ||
    !Number.isFinite(body.discount_value) ||
    body.discount_value <= 0 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.expiry_date)
  )
    throw new ApiError(
      400,
      "Provide a code, valid discount type, positive value, and expiry date.",
    );
  const coupon = await Coupon.create({
    code: body.code.trim().toUpperCase(),
    discount_type: body.discount_type,
    discount_value: body.discount_value,
    minimum_order_amount: Number(body.minimum_order_amount || 0),
    maximum_discount:
      body.maximum_discount == null ? null : Number(body.maximum_discount),
    expiry_date: body.expiry_date,
    usage_limit: body.usage_limit == null ? null : Number(body.usage_limit),
  });
  return sendData(res, { coupon }, 201);
}
export async function validateCoupon(req, res) {
  ensureMongo();
  const { code, subtotal } = req.body;
  if (typeof code !== "string" || !Number.isFinite(subtotal) || subtotal < 0)
    throw new ApiError(400, "A coupon code and valid subtotal are required.");
  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    is_active: true,
    expiry_date: { $gte: today() },
    $expr: {
      $or: [
        { $eq: ["$usage_limit", null] },
        { $lt: ["$usage_count", "$usage_limit"] },
      ],
    },
  }).lean();
  if (!coupon)
    throw new ApiError(400, "Coupon is invalid, expired, or fully redeemed.");
  if (subtotal < coupon.minimum_order_amount)
    throw new ApiError(
      400,
      `This coupon requires a minimum order of ₹${coupon.minimum_order_amount}.`,
    );
  const discount = Math.min(
    coupon.discount_type === "percentage"
      ? (subtotal * coupon.discount_value) / 100
      : coupon.discount_value,
    coupon.maximum_discount ?? Infinity,
    subtotal,
  );
  return sendData(res, {
    valid: true,
    coupon: { code: coupon.code, discount_type: coupon.discount_type },
    discount: Math.round(discount * 100) / 100,
  });
}
