import { Notification } from "../models/index.js";
import { ensureMongo } from "../config/mongo.js";
import { ApiError, sendData } from "../utils/apiResponse.js";

export async function getNotifications(req, res) {
  ensureMongo();
  const notifications = await Notification.find({ user_id: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return sendData(res, { notifications });
}
export async function markNotificationRead(req, res) {
  ensureMongo();
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, user_id: req.user.id },
    { $set: { read_at: new Date() } },
    { new: true },
  );
  if (!notification) throw new ApiError(404, "Notification not found.");
  return sendData(res, { notification });
}
