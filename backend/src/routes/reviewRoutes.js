import { Router } from "express";
import { createReview, getReviews } from "../controllers/reviewController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get("/", asyncHandler(getReviews));
router.post("/", authenticate, asyncHandler(createReview));
export default router;
