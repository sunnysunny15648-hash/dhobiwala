import mongoose from "mongoose";

const { Schema } = mongoose;
const jsonOptions = {
  virtuals: false,
  versionKey: false,
  transform: (_doc, value) => {
    value.id = String(value._id);
    delete value._id;
    return value;
  },
};
const timestamps = {
  timestamps: true,
  toJSON: jsonOptions,
  toObject: jsonOptions,
};

const profileSchema = new Schema(
  {
    _id: { type: String },
    full_name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    phone: { type: String, required: true, trim: true, maxlength: 18 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    role: {
      type: String,
      enum: ["customer", "admin", "employee"],
      default: "customer",
      immutable: false,
    },
  },
  timestamps,
);
profileSchema.index({ role: 1, createdAt: -1 });

const addressSchema = new Schema(
  {
    user_id: { type: String, required: true, index: true },
    address_line: { type: String, required: true, maxlength: 240 },
    city: { type: String, required: true, maxlength: 100 },
    state: { type: String, default: "" },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    landmark: { type: String, default: "" },
    phone: { type: String, default: "" },
    is_default: { type: Boolean, default: false },
  },
  timestamps,
);
addressSchema.index({ user_id: 1, is_default: -1 });
addressSchema.index(
  { user_id: 1 },
  { unique: true, partialFilterExpression: { is_default: true } },
);

const serviceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 120,
    },
    description: { type: String, default: "", maxlength: 1000 },
    price: { type: Number, required: true, min: 0 },
    estimated_hours: { type: Number, required: true, min: 1, max: 720 },
    image_url: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
  },
  timestamps,
);
serviceSchema.index({ is_active: 1, name: 1 });

const clothingItemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    image_url: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
  },
  timestamps,
);
clothingItemSchema.index({ is_active: 1, name: 1 });

const orderSchema = new Schema(
  {
    order_number: { type: String, required: true, unique: true, index: true },
    customer_id: { type: String, required: true, index: true },
    address_id: { type: Schema.Types.ObjectId, ref: "Address", required: true },
    pickup_date: { type: String, required: true },
    pickup_slot: {
      type: String,
      required: true,
      enum: ["8 AM – 10 AM", "10 AM – 12 PM", "12 PM – 2 PM", "4 PM – 6 PM"],
    },
    delivery_date: { type: String, default: null },
    service_id: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    subtotal: { type: Number, required: true, min: 0 },
    pickup_charge: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total_amount: { type: Number, required: true, min: 0 },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    payment_method: { type: String, enum: ["cod", "razorpay"], required: true },
    order_status: {
      type: String,
      enum: [
        "placed",
        "pickup_scheduled",
        "collected",
        "washing",
        "quality_check",
        "ready_for_delivery",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pickup_scheduled",
    },
    special_instructions: { type: String, default: "", maxlength: 500 },
    service_snapshot: { type: Schema.Types.Mixed, required: true },
    address_snapshot: { type: Schema.Types.Mixed, required: true },
    items: [
      {
        clothing_item_id: { type: Schema.Types.ObjectId, ref: "ClothingItem" },
        item_name: String,
        unit_price: { type: Number, min: 0 },
        quantity: { type: Number, min: 1, max: 100 },
        subtotal: { type: Number, min: 0 },
      },
    ],
  },
  timestamps,
);
orderSchema.index({ customer_id: 1, createdAt: -1 });
orderSchema.index({ order_status: 1, createdAt: -1 });
orderSchema.index({ pickup_date: 1, pickup_slot: 1 });

const employeeSchema = new Schema(
  {
    profile_id: { type: String, required: true, unique: true },
    employee_code: { type: String, required: true, unique: true },
    availability_status: {
      type: String,
      enum: ["available", "busy", "inactive"],
      default: "available",
    },
  },
  timestamps,
);

const assignmentSchema = new Schema(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    employee_id: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    assignment_type: {
      type: String,
      enum: ["pickup", "delivery"],
      required: true,
    },
    assigned_at: { type: Date, default: Date.now },
    completed_at: { type: Date, default: null },
    status: {
      type: String,
      enum: [
        "assigned",
        "on_the_way",
        "picked_up",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "assigned",
    },
  },
  timestamps,
);
assignmentSchema.index({ order_id: 1, assignment_type: 1 }, { unique: true });
assignmentSchema.index({ employee_id: 1, status: 1 });

const paymentSchema = new Schema(
  {
    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    customer_id: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    payment_method: { type: String, enum: ["cod", "razorpay"], required: true },
    provider_order_id: { type: String, unique: true, sparse: true },
    transaction_id: { type: String, unique: true, sparse: true },
    payment_status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },
  },
  timestamps,
);

const reviewSchema = new Schema(
  {
    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    customer_id: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 1000 },
  },
  timestamps,
);

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
    },
    discount_type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discount_value: { type: Number, required: true, min: 0.01 },
    minimum_order_amount: { type: Number, default: 0, min: 0 },
    maximum_discount: { type: Number, default: null, min: 0 },
    expiry_date: { type: String, required: true },
    usage_limit: { type: Number, default: null, min: 1 },
    usage_count: { type: Number, default: 0, min: 0 },
    is_active: { type: Boolean, default: true },
  },
  timestamps,
);

const redemptionSchema = new Schema(
  {
    coupon_id: { type: Schema.Types.ObjectId, ref: "Coupon", required: true },
    customer_id: { type: String, required: true },
    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
  },
  timestamps,
);
redemptionSchema.index({ coupon_id: 1, customer_id: 1 });

const historySchema = new Schema(
  {
    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    order_status: { type: String, required: true },
    changed_by: { type: String, default: null },
    note: { type: String, default: "" },
  },
  timestamps,
);

const notificationSchema = new Schema(
  {
    user_id: { type: String, required: true, index: true },
    order_id: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read_at: { type: Date, default: null },
  },
  timestamps,
);
notificationSchema.index({ user_id: 1, createdAt: -1 });

const pickupSlotCounterSchema = new Schema(
  {
    pickup_date: { type: String, required: true },
    pickup_slot: { type: String, required: true },
    count: { type: Number, min: 0 },
  },
  { versionKey: false },
);
pickupSlotCounterSchema.index(
  { pickup_date: 1, pickup_slot: 1 },
  { unique: true },
);

export const Profile =
  mongoose.models.Profile || mongoose.model("Profile", profileSchema);
export const Address =
  mongoose.models.Address || mongoose.model("Address", addressSchema);
export const Service =
  mongoose.models.Service || mongoose.model("Service", serviceSchema);
export const ClothingItem =
  mongoose.models.ClothingItem ||
  mongoose.model("ClothingItem", clothingItemSchema);
export const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema);
export const Employee =
  mongoose.models.Employee || mongoose.model("Employee", employeeSchema);
export const OrderAssignment =
  mongoose.models.OrderAssignment ||
  mongoose.model("OrderAssignment", assignmentSchema);
export const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
export const Review =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);
export const Coupon =
  mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
export const CouponRedemption =
  mongoose.models.CouponRedemption ||
  mongoose.model("CouponRedemption", redemptionSchema);
export const OrderStatusHistory =
  mongoose.models.OrderStatusHistory ||
  mongoose.model("OrderStatusHistory", historySchema);
export const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
export const PickupSlotCounter =
  mongoose.models.PickupSlotCounter ||
  mongoose.model("PickupSlotCounter", pickupSlotCounterSchema);

export function plain(doc) {
  if (!doc) return null;
  if (Array.isArray(doc)) return doc.map(plain);
  return doc.toJSON ? doc.toJSON() : doc;
}
