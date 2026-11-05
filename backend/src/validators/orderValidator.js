import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    service_id: z.string().uuid(),
    address_id: z.string().uuid(),
    pickup_date: z.string().date(),
    pickup_slot: z.enum([
      "8 AM – 10 AM",
      "10 AM – 12 PM",
      "12 PM – 2 PM",
      "4 PM – 6 PM",
    ]),
    payment_method: z.enum(["cod", "razorpay"]).default("cod"),
    special_instructions: z.string().trim().max(500).optional().default(""),
    coupon_code: z.string().trim().max(32).optional().nullable(),
    items: z
      .array(
        z.object({
          clothing_item_id: z.string().uuid(),
          quantity: z.number().int().min(1).max(100),
        }),
      )
      .min(1)
      .max(30),
  }),
});

export const orderStatusSchema = z.object({
  body: z.object({
    order_status: z.enum([
      "pickup_scheduled",
      "collected",
      "washing",
      "quality_check",
      "ready_for_delivery",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ]),
  }),
});
