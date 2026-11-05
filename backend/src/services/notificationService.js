import { Notification } from "../models/index.js";

export async function createInAppNotification({
  userId,
  title,
  message,
  orderId,
}) {
  await Notification.create({
    user_id: userId,
    title,
    message,
    order_id: orderId || null,
  });
}
