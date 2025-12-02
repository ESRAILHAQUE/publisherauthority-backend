import { Router } from "express";
import authController from "./auth.controller";
import { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation } from "./auth.validation";
import validateRequest from "../../middleware/validateRequest";

/**
 * Auth Routes
 * Defines all authentication-related routes
 */
const router = Router();

// Public routes
router.post(
  "/register",
  registerValidation,
  validateRequest,
  authController.register
);
router.post("/login", loginValidation, validateRequest, authController.login);
router.post("/forgot-password", forgotPasswordValidation, validateRequest, authController.forgotPassword);
router.post("/reset-password", resetPasswordValidation, validateRequest, authController.resetPassword);

// Protected routes (will add auth middleware later)
router.get("/me", authController.getMe);
router.post("/logout", authController.logout);

export default router;
