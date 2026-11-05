import mongoose from "mongoose";
import {
  Address,
  ClothingItem,
  Coupon,
  CouponRedemption,
  Notification,
  Order,
  OrderStatusHistory,
  Payment,
  PickupSlotCounter,
  Service,
} from "../models/index.js";
import { ensureMongo } from "../config/mongo.js";
import { ApiError } from "../utils/apiResponse.js";
import { generateOrderId } from "../utils/generateOrderId.js";

const transitions = {
  placed: ["pickup_scheduled", "cancelled"],
  pickup_scheduled: ["collected", "cancelled"],
  collected: ["washing"],
  washing: ["quality_check"],
  quality_check: ["washing", "ready_for_delivery"],
  ready_for_delivery: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function createOrderForCustomer(customerId, input) {
  ensureMongo();
  const session = await mongoose.startSession();
  let createdOrder;
  try {
    await session.withTransaction(async () => {
      const address = await Address.findOne({
        _id: input.address_id,
        user_id: customerId,
      }).session(session);
      if (!address)
        throw new ApiError(
          403,
          "Pickup address does not belong to this customer.",
        );
      const service = await Service.findOne({
        _id: input.service_id,
        is_active: true,
      }).session(session);
      if (!service) throw new ApiError(400, "Selected service is unavailable.");
      const today = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      );
      const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      if (input.pickup_date < todayDate)
        throw new ApiError(400, "Pickup date cannot be in the past.");
      if (input.pickup_date === todayDate) {
        const slotStart = {
          "8 AM – 10 AM": 8,
          "10 AM – 12 PM": 10,
          "12 PM – 2 PM": 12,
          "4 PM – 6 PM": 16,
        }[input.pickup_slot];
        if (slotStart <= today.getHours())
          throw new ApiError(400, "This pickup time has already passed.");
      }
      const slot = await PickupSlotCounter.findOneAndUpdate(
        { pickup_date: input.pickup_date, pickup_slot: input.pickup_slot },
        {
          $inc: { count: 1 },
        },
        { upsert: true, new: true, session, setDefaultsOnInsert: true },
      );
      if (slot.count > 10)
        throw new ApiError(
          409,
          "This pickup slot is full. Choose another time.",
        );
      const ids = input.items.map((item) => item.clothing_item_id);
      const catalog = await ClothingItem.find({
        _id: { $in: ids },
        is_active: true,
      }).session(session);
      if (catalog.length !== new Set(ids).size)
        throw new ApiError(400, "A selected clothing item is unavailable.");
      const byId = new Map(catalog.map((item) => [String(item._id), item]));
      const orderItems = input.items.map(({ clothing_item_id, quantity }) => {
        const item = byId.get(String(clothing_item_id));
        return {
          clothing_item_id: item._id,
          item_name: item.name,
          unit_price: item.price,
          quantity,
          subtotal: item.price * quantity,
        };
      });
      let subtotal =
        service.price +
        orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      let discount = 0;
      let coupon = null;
      if (input.coupon_code) {
        coupon = await Coupon.findOne({
          code: input.coupon_code.trim().toUpperCase(),
          is_active: true,
          expiry_date: { $gte: todayDate },
          $or: [
            { usage_limit: null },
            { $expr: { $lt: ["$usage_count", "$usage_limit"] } },
          ],
        }).session(session);
        if (!coupon)
          throw new ApiError(
            400,
            "Coupon is invalid, expired, or fully redeemed.",
          );
        if (subtotal < coupon.minimum_order_amount)
          throw new ApiError(
            400,
            `This coupon requires a minimum order of ₹${coupon.minimum_order_amount}.`,
          );
        discount = Math.min(
          coupon.discount_type === "percentage"
            ? (subtotal * coupon.discount_value) / 100
            : coupon.discount_value,
          coupon.maximum_discount ?? subtotal,
          subtotal,
        );
      }
      const order = new Order({
        order_number: generateOrderId(),
        customer_id: customerId,
        address_id: address._id,
        pickup_date: input.pickup_date,
        pickup_slot: input.pickup_slot,
        service_id: service._id,
        subtotal,
        pickup_charge: 0,
        discount,
        tax: 0,
        total_amount: subtotal - discount,
        payment_status: "pending",
        payment_method: input.payment_method,
        order_status: "pickup_scheduled",
        special_instructions: input.special_instructions || "",
        service_snapshot: { name: service.name, price: service.price },
        address_snapshot: {
          address_line: address.address_line,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          phone: address.phone,
        },
        items: orderItems,
      });
      await order.save({ session });
      await Payment.create(
        [
          {
            order_id: order._id,
            customer_id: customerId,
            amount: order.total_amount,
            payment_method: input.payment_method,
            payment_status: "pending",
          },
        ],
        { session },
      );
      await OrderStatusHistory.create(
        [
          {
            order_id: order._id,
            order_status: "placed",
            changed_by: customerId,
            note: "Order placed.",
          },
          {
            order_id: order._id,
            order_status: "pickup_scheduled",
            changed_by: customerId,
            note: "Pickup window confirmed.",
          },
        ],
        { session },
      );
      if (coupon) {
        await CouponRedemption.create(
          [
            {
              coupon_id: coupon._id,
              customer_id: customerId,
              order_id: order._id,
            },
          ],
          { session },
        );
        coupon.usage_count += 1;
        await coupon.save({ session });
      }
      await Notification.create(
        [
          {
            user_id: customerId,
            order_id: order._id,
            title: "Pickup confirmed",
            message: `Order ${order.order_number} is now pickup scheduled.`,
          },
        ],
        { session },
      );
      createdOrder = order;
    });
  } finally {
    await session.endSession();
  }
  return createdOrder.toJSON();
}

export async function changeOrderStatus({ orderId, status, actorId }) {
  ensureMongo();
  const session = await mongoose.startSession();
  let updated;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new ApiError(404, "Order not found.");
      if (!transitions[order.order_status]?.includes(status))
        throw new ApiError(409, "This order status transition is not allowed.");
      if (status === "cancelled")
        await PickupSlotCounter.updateOne(
          {
            pickup_date: order.pickup_date,
            pickup_slot: order.pickup_slot,
            count: { $gt: 0 },
          },
          { $inc: { count: -1 } },
          { session },
        );
      order.order_status = status;
      if (status === "delivered")
        order.delivery_date = new Date().toISOString().slice(0, 10);
      await order.save({ session });
      await OrderStatusHistory.create(
        [
          {
            order_id: order._id,
            order_status: status,
            changed_by: actorId,
            note: "Status updated.",
          },
        ],
        { session },
      );
      await Notification.create(
        [
          {
            user_id: order.customer_id,
            order_id: order._id,
            title: status.replaceAll("_", " "),
            message: `Order ${order.order_number} is now ${status.replaceAll("_", " ")}.`,
          },
        ],
        { session },
      );
      updated = order;
    });
  } finally {
    await session.endSession();
  }
  return updated.toJSON();
}

export async function setPaymentStatus(paymentId, status) {
  ensureMongo();
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment) throw new ApiError(404, "Payment not found.");
      const allowed =
        (payment.payment_status === "pending" &&
          ["succeeded", "failed"].includes(status)) ||
        (payment.payment_status === "succeeded" && status === "refunded");
      if (!allowed)
        throw new ApiError(
          409,
          "This payment status transition is not allowed.",
        );
      payment.payment_status = status;
      await payment.save({ session });
      await Order.findByIdAndUpdate(
        payment.order_id,
        {
          payment_status:
            status === "succeeded"
              ? "paid"
              : status === "refunded"
                ? "refunded"
                : "failed",
        },
        { session },
      );
      result = payment;
    });
  } finally {
    await session.endSession();
  }
  return result.toJSON();
}
