import {
  Address,
  Order,
  OrderStatusHistory,
  Service,
} from "../models/index.js";
import { ensureMongo } from "../config/mongo.js";
import {
  changeOrderStatus,
  createOrderForCustomer,
} from "../services/orderService.js";
import { ApiError, sendData } from "../utils/apiResponse.js";

export async function createOrder(req, res) {
  const order = await createOrderForCustomer(req.user.id, req.validated.body);
  return sendData(res, { order }, 201);
}
export async function getOrders(req, res) {
  ensureMongo();
  const orders = await Order.find({ customer_id: req.user.id })
    .sort({ createdAt: -1 })
    .lean();
  return sendData(res, { orders: await populateOrders(orders) });
}
export async function getOrder(req, res) {
  ensureMongo();
  const filter = { _id: req.params.orderId };
  if (req.user.role !== "admin") filter.customer_id = req.user.id;
  const order = await Order.findOne(filter).lean();
  if (!order) throw new ApiError(404, "Order not found.");
  return sendData(res, { order: await populateOrders(order) });
}
export async function getTracking(req, res) {
  const { order } = await getOwnedOrder(req.params.orderId, req.user);
  const history = await OrderStatusHistory.find({ order_id: order._id })
    .sort({ createdAt: 1 })
    .lean();
  return sendData(res, { order, history });
}
export async function cancelOrder(req, res) {
  const { order } = await getOwnedOrder(req.params.orderId, req.user);
  if (!["placed", "pickup_scheduled"].includes(order.order_status))
    throw new ApiError(
      409,
      "Orders can only be cancelled before the laundry is collected.",
    );
  return sendData(res, {
    order: await changeOrderStatus({
      orderId: order._id,
      status: "cancelled",
      actorId: req.user.id,
    }),
  });
}
export async function updateOrderStatus(req, res) {
  return sendData(res, {
    order: await changeOrderStatus({
      orderId: req.params.orderId,
      status: req.validated.body.order_status,
      actorId: req.user.id,
    }),
  });
}
async function getOwnedOrder(orderId, user) {
  ensureMongo();
  const filter = { _id: orderId };
  if (user.role !== "admin") filter.customer_id = user.id;
  const order = await Order.findOne(filter).lean();
  if (!order) throw new ApiError(404, "Order not found.");
  return { order: await populateOrders(order) };
}
async function populateOrders(value) {
  const list = Array.isArray(value) ? value : [value];
  return Promise.all(
    list.map(async (order) => {
      const [service, address] = await Promise.all([
        Service.findById(order.service_id).select("name").lean(),
        Address.findById(order.address_id)
          .select("address_line city state pincode phone")
          .lean(),
      ]);
      return {
        ...order,
        service: service || order.service_snapshot,
        address: address || order.address_snapshot,
      };
    }),
  ).then((rows) => (Array.isArray(value) ? rows : rows[0]));
}
