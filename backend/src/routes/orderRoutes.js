import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  getOrder,
  getOrders,
  getTracking,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import {
  createOrderSchema,
  orderStatusSchema,
} from "../validators/orderValidator.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(authenticate);
router.post("/", validate(createOrderSchema), asyncHandler(createOrder));
router.get("/", asyncHandler(getOrders));
router.get("/:orderId/tracking", asyncHandler(getTracking));
router.get("/:orderId", asyncHandler(getOrder));
router.put("/:orderId/cancel", asyncHandler(cancelOrder));
router.patch(
  "/:orderId/status",
  allowRoles("admin"),
  validate(orderStatusSchema),
  asyncHandler(updateOrderStatus),
);
export default router;
