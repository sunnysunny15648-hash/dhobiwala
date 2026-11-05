import { Router } from "express";
import {
  assignEmployee,
  createEmployee,
  getAdminDashboard,
  getAdminOrders,
  getAdminPayments,
  getAdminReports,
  getCustomers,
  getEmployees,
  updateAdminPayment,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(authenticate, allowRoles("admin"));
router.get("/dashboard", asyncHandler(getAdminDashboard));
router.get("/orders", asyncHandler(getAdminOrders));
router.get("/customers", asyncHandler(getCustomers));
router.get("/employees", asyncHandler(getEmployees));
router.post("/employees", asyncHandler(createEmployee));
router.get("/payments", asyncHandler(getAdminPayments));
router.patch("/payments/:paymentId", asyncHandler(updateAdminPayment));
router.get("/reports", asyncHandler(getAdminReports));
router.patch("/orders/:orderId/assign", asyncHandler(assignEmployee));
export default router;
