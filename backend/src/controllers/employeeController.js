import mongoose from "mongoose";
import {
  Address,
  Employee,
  Order,
  OrderAssignment,
  Profile,
} from "../models/index.js";
import { ensureMongo } from "../config/mongo.js";
import { ApiError, sendData } from "../utils/apiResponse.js";

async function getEmployee(profileId) {
  const employee = await Employee.findOne({ profile_id: profileId }).lean();
  if (!employee) throw new ApiError(403, "Employee profile not found.");
  return employee;
}
async function populateTask(task) {
  const order = await Order.findById(task.order_id).lean();
  if (!order) return { ...task, order: null };
  const [customer, address] = await Promise.all([
    Profile.findById(order.customer_id).select("full_name phone").lean(),
    Address.findById(order.address_id)
      .select("address_line city state pincode phone")
      .lean(),
  ]);
  return {
    ...task,
    order: { ...order, customer, address: address || order.address_snapshot },
  };
}
export async function getTasks(req, res) {
  ensureMongo();
  const employee = await getEmployee(req.user.id);
  const tasks = await OrderAssignment.find({ employee_id: employee._id })
    .sort({ assigned_at: 1 })
    .lean();
  return sendData(res, { tasks: await Promise.all(tasks.map(populateTask)) });
}
export async function getTask(req, res) {
  ensureMongo();
  const employee = await getEmployee(req.user.id);
  const task = await OrderAssignment.findOne({
    _id: req.params.taskId,
    employee_id: employee._id,
  }).lean();
  if (!task) throw new ApiError(404, "Assigned task not found.");
  return sendData(res, { task: await populateTask(task) });
}
export async function updateTaskStatus(req, res) {
  ensureMongo();
  const employee = await getEmployee(req.user.id);
  const allowed = [
    "assigned",
    "on_the_way",
    "picked_up",
    "out_for_delivery",
    "delivered",
  ];
  if (!allowed.includes(req.body.status))
    throw new ApiError(400, "Invalid task status.");
  if (req.body.status === "delivered" && req.body.delivery_confirmed !== true)
    throw new ApiError(
      400,
      "Confirm the customer received the order before marking it delivered.",
    );
  const session = await mongoose.startSession();
  let task;
  try {
    await session.withTransaction(async () => {
      task = await OrderAssignment.findOne({
        _id: req.params.taskId,
        employee_id: employee._id,
      }).session(session);
      if (!task) throw new ApiError(404, "Assigned task not found.");
      const valid =
        task.assignment_type === "pickup"
          ? (task.status === "assigned" && req.body.status === "on_the_way") ||
            (task.status === "on_the_way" && req.body.status === "picked_up")
          : (task.status === "assigned" &&
              req.body.status === "out_for_delivery") ||
            (task.status === "out_for_delivery" &&
              req.body.status === "delivered" &&
              req.body.delivery_confirmed === true);
      if (!valid)
        throw new ApiError(409, "Task status transition is not allowed.");
      const order = await Order.findById(task.order_id).session(session);
      if (!order) throw new ApiError(404, "Order not found.");
      if (req.body.status === "picked_up") {
        if (order.order_status !== "pickup_scheduled")
          throw new ApiError(409, "This order is not awaiting pickup.");
        order.order_status = "collected";
      }
      if (req.body.status === "out_for_delivery") {
        if (order.order_status !== "ready_for_delivery")
          throw new ApiError(409, "This order is not ready for delivery.");
        order.order_status = "out_for_delivery";
      }
      if (req.body.status === "delivered") {
        if (order.order_status !== "out_for_delivery")
          throw new ApiError(409, "This order is not out for delivery.");
        order.order_status = "delivered";
        order.delivery_date = new Date().toISOString().slice(0, 10);
      }
      if (
        ["picked_up", "out_for_delivery", "delivered"].includes(req.body.status)
      ) {
        await order.save({ session });
        const { OrderStatusHistory, Notification } =
          await import("../models/index.js");
        await OrderStatusHistory.create(
          [
            {
              order_id: order._id,
              order_status: order.order_status,
              changed_by: req.user.id,
              note: "Employee task updated.",
            },
          ],
          { session },
        );
        await Notification.create(
          [
            {
              user_id: order.customer_id,
              order_id: order._id,
              title: order.order_status.replaceAll("_", " "),
              message: `Order ${order.order_number} is now ${order.order_status.replaceAll("_", " ")}.`,
            },
          ],
          { session },
        );
      }
      task.status = req.body.status;
      if (["picked_up", "delivered"].includes(task.status))
        task.completed_at = new Date();
      await task.save({ session });
    });
  } finally {
    await session.endSession();
  }
  return sendData(res, { task: task.toJSON() });
}
