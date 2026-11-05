import { Router } from "express";
import {
  createService,
  deleteService,
  getService,
  getServices,
  updateService,
} from "../controllers/serviceController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get("/", asyncHandler(getServices));
router.get("/:serviceId", asyncHandler(getService));
router.post(
  "/",
  authenticate,
  allowRoles("admin"),
  asyncHandler(createService),
);
router.put(
  "/:serviceId",
  authenticate,
  allowRoles("admin"),
  asyncHandler(updateService),
);
router.delete(
  "/:serviceId",
  authenticate,
  allowRoles("admin"),
  asyncHandler(deleteService),
);
export default router;
