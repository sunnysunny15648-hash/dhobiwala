import { Router } from "express";
import {
  getNotifications,
  markNotificationRead,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(getNotifications));
router.patch("/:notificationId/read", asyncHandler(markNotificationRead));
export default router;
