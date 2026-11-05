import { randomBytes } from "node:crypto";
import { supabaseAdmin, supabaseAuth } from "../config/supabase.js";
import {
  Address,
  Employee,
  Order,
  OrderAssignment,
  Payment,
  Profile,
  Review,
  Service,
} from "../models/index.js";
import { ensureMongo } from "../config/mongo.js";
import { setPaymentStatus } from "../services/orderService.js";
import { ApiError, sendData } from "../utils/apiResponse.js";

export async function getAdminDashboard(_req, res) {
  ensureMongo();
  const [customers, orders, pending, processing, completed, today, revenue] =
    await Promise.all([
      Profile.countDocuments({ role: "customer" }),
      Order.countDocuments(),
      Order.countDocuments({ order_status: "placed" }),
      Order.countDocuments({ order_status: "washing" }),
      Order.countDocuments({ order_status: "delivered" }),
      Order.countDocuments({
        createdAt: {
          $gte: new Date(
            new Date().toLocaleDateString("en-US", {
              timeZone: "Asia/Kolkata",
            }),
          ),
        },
      }),
      Payment.aggregate([
        { $match: { payment_status: "succeeded" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);
  return sendData(res, {
    dashboard: {
      total_customers: customers,
      total_orders: orders,
      pending_orders: pending,
      processing_orders: processing,
      completed_orders: completed,
      today_orders: today,
      total_revenue: revenue[0]?.total || 0,
    },
  });
}
export async function getAdminOrders(req, res) {
  ensureMongo();
  const filter = {};
  if (req.query.status) filter.order_status = req.query.status;
  if (req.query.search)
    filter.order_number = {
      $regex: String(req.query.search).slice(0, 40),
      $options: "i",
    };
  if (req.query.from || req.query.to)
    filter.createdAt = {
      ...(req.query.from && { $gte: new Date(req.query.from) }),
      ...(req.query.to && { $lte: new Date(`${req.query.to}T23:59:59.999Z`) }),
    };
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();
  const populated = await Promise.all(
    orders.map(async (order) => {
      const [customer, address] = await Promise.all([
        Profile.findById(order.customer_id)
          .select("full_name email phone")
          .lean(),
        Address.findById(order.address_id)
          .select("address_line city pincode")
          .lean(),
      ]);
      return { ...order, customer, address, service: order.service_snapshot };
    }),
  );
  return sendData(res, { orders: populated });
}
export async function getCustomers(_req, res) {
  ensureMongo();
  const customers = await Profile.find({ role: "customer" })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  return sendData(res, { customers });
}
export async function getEmployees(_req, res) {
  ensureMongo();
  const employees = await Employee.find().sort({ createdAt: -1 }).lean();
  const populated = await Promise.all(
    employees.map(async (employee) => ({
      ...employee,
      profile: await Profile.findById(employee.profile_id)
        .select("full_name email phone")
        .lean(),
    })),
  );
  return sendData(res, { employees: populated });
}
export async function createEmployee(req, res) {
  ensureMongo();
  if (!supabaseAuth || !supabaseAdmin)
    throw new ApiError(503, "Supabase Auth admin key is not configured.");
  const { full_name, email, phone, password } = req.body;
  if (
    typeof full_name !== "string" ||
    full_name.trim().length < 2 ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    password.length < 10 ||
    typeof phone !== "string"
  )
    throw new ApiError(
      400,
      "Provide a name, email, phone, and a password of at least 10 characters.",
    );
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim(), phone },
  });
  if (error) throw new ApiError(400, error.message);
  const profile = await Profile.create({
    _id: created.user.id,
    full_name: full_name.trim(),
    email: email.toLowerCase(),
    phone,
    role: "employee",
  });
  const employee = await Employee.create({
    profile_id: profile._id,
    employee_code: `DW-${randomBytes(3).toString("hex").toUpperCase()}`,
  });
  return sendData(
    res,
    { employee: { ...employee.toJSON(), profile: profile.toJSON() } },
    201,
  );
}
export async function assignEmployee(req, res) {
  ensureMongo();
  const { employee_id, assignment_type } = req.body;
  if (
    typeof employee_id !== "string" ||
    !["pickup", "delivery"].includes(assignment_type)
  )
    throw new ApiError(
      400,
      "Provide an employee and assignment type (pickup or delivery).",
    );
  if (!(await Order.exists({ _id: req.params.orderId })))
    throw new ApiError(404, "Order not found.");
  if (!(await Employee.exists({ _id: employee_id })))
    throw new ApiError(404, "Employee not found.");
  const assignment = await OrderAssignment.findOneAndUpdate(
    { order_id: req.params.orderId, assignment_type },
    { $set: { employee_id, status: "assigned", assigned_at: new Date() } },
    { upsert: true, new: true, runValidators: true },
  );
  return sendData(res, { assignment });
}
export async function getAdminPayments(_req, res) {
  ensureMongo();
  const payments = await Payment.find()
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  const populated = await Promise.all(
    payments.map(async (payment) => ({
      ...payment,
      order: await Order.findById(payment.order_id)
        .select("order_number")
        .lean(),
    })),
  );
  return sendData(res, { payments: populated });
}
export async function updateAdminPayment(req, res) {
  if (!["succeeded", "failed", "refunded"].includes(req.body.payment_status))
    throw new ApiError(
      400,
      "Payment status must be succeeded, failed, or refunded.",
    );
  return sendData(res, {
    payment: await setPaymentStatus(
      req.params.paymentId,
      req.body.payment_status,
    ),
  });
}
export async function getAdminReports(req, res) {
  ensureMongo();
  const period = ["week", "month", "year"].includes(req.query.period)
    ? req.query.period
    : "month";
  const start = new Date();
  if (period === "week") start.setDate(start.getDate() - 6);
  else if (period === "year") start.setFullYear(start.getFullYear() - 1);
  else start.setDate(1);
  const orders = await Order.find({ createdAt: { $gte: start } })
    .select("createdAt total_amount payment_status service_snapshot")
    .lean();
  const daily = new Map();
  const popular = new Map();
  for (const order of orders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    daily.set(day, (daily.get(day) || 0) + 1);
    const name = order.service_snapshot?.name || "Unknown";
    popular.set(name, (popular.get(name) || 0) + 1);
  }
  return sendData(res, {
    period,
    total_orders: orders.length,
    revenue: orders
      .filter((o) => o.payment_status === "paid")
      .reduce((total, o) => total + o.total_amount, 0),
    daily_orders: [...daily].map(([date, count]) => ({ date, orders: count })),
    popular_services: [...popular]
      .map(([name, count]) => ({ name, orders: count }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 8),
  });
}
