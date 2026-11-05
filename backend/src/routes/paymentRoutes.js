import { Router } from "express";
import {
  createPayment,
  verifyPayment,
  paymentWebhook,
} from "../controllers/paymentController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.post("/webhook", asyncHandler(paymentWebhook));
router.post("/create", authenticate, asyncHandler(createPayment));
router.post("/verify", authenticate, asyncHandler(verifyPayment));
export default router;
