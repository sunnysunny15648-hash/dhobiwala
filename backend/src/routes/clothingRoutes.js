import { Router } from "express";
import {
  getClothingItems,
  updateClothingItem,
} from "../controllers/serviceController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get("/", asyncHandler(getClothingItems));
router.patch(
  "/:itemId",
  authenticate,
  allowRoles("admin"),
  asyncHandler(updateClothingItem),
);
export default router;
