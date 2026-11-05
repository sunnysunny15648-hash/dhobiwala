import { Router } from "express";
import {
  getTask,
  getTasks,
  updateTaskStatus,
} from "../controllers/employeeController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(authenticate, allowRoles("employee"));
router.get("/tasks", asyncHandler(getTasks));
router.get("/tasks/:taskId", asyncHandler(getTask));
router.patch("/tasks/:taskId/status", asyncHandler(updateTaskStatus));
export default router;
