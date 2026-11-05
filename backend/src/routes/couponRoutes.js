import { Router } from "express";
import {
  createCoupon,
  getCoupons,
  validateCoupon,
} from "../controllers/couponController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get("/", asyncHandler(getCoupons));
router.post("/", authenticate, allowRoles("admin"), asyncHandler(createCoupon));
router.post("/validate", authenticate, asyncHandler(validateCoupon));
export default router;
