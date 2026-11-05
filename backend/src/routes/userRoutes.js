import { Router } from "express";
import {
  addAddress,
  deleteAddress,
  getAddresses,
  getProfile,
  updateAddress,
  updateProfile,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(authenticate);
router.get("/profile", asyncHandler(getProfile));
router.put("/profile", asyncHandler(updateProfile));
router.get("/addresses", asyncHandler(getAddresses));
router.post("/addresses", asyncHandler(addAddress));
router.put("/addresses/:addressId", asyncHandler(updateAddress));
router.delete("/addresses/:addressId", asyncHandler(deleteAddress));
export default router;
