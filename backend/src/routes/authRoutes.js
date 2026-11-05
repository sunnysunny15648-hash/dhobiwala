import { Router } from "express";
import {
  login,
  logout,
  me,
  register,
  refreshSession,
  requestPasswordReset,
  updatePassword,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginSchema, registerSchema } from "../validators/authValidator.js";

const router = Router();
router.post("/register", validate(registerSchema), asyncHandler(register));
router.post("/login", validate(loginSchema), asyncHandler(login));
router.post("/refresh", asyncHandler(refreshSession));
router.post("/password-reset", asyncHandler(requestPasswordReset));
router.put("/password", authenticate, asyncHandler(updatePassword));
router.post("/logout", authenticate, asyncHandler(logout));
router.get("/me", authenticate, asyncHandler(me));
export default router;
