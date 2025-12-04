import { Request, Response, NextFunction } from "express";
import authService from "./auth.service";
import asyncHandler from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";

/**
 * Auth Controller
 * Handles HTTP requests for authentication
 */
class AuthController {
  /**
   * @route   POST /api/v1/auth/register
   * @desc    Register a new user
   * @access  Public
   */
  register = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { firstName, lastName, email, password, country, role } = req.body;

      const { user, token } = await authService.register({
        firstName,
        lastName,
        email,
        password,
        country,
        role,
      });

      sendSuccess(res, 201, "User registered successfully", {
        user,
        token,
      });
    }
  );

  /**
   * @route   POST /api/v1/auth/login
   * @desc    Login user
   * @access  Public
   */
  login = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { email, password } = req.body;

      const { user, token } = await authService.login({ email, password });

      sendSuccess(res, 200, "Login successful", {
        user,
        token,
      });
    }
  );

  /**
   * @route   GET /api/v1/auth/me
   * @desc    Get current user profile
   * @access  Private
   */
  getMe = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userId = (req as any).user?.id;

      const user = await authService.getUserById(userId);

      sendSuccess(res, 200, "User profile retrieved successfully", { user });
    }
  );

  /**
   * @route   POST /api/v1/auth/logout
   * @desc    Logout user (client-side token removal)
   * @access  Private
   */
  logout = asyncHandler(
    async (_req: Request, res: Response, _next: NextFunction) => {
      // Since we're using JWT tokens stored in localStorage,
      // logout is handled client-side by removing the token.
      // This endpoint just confirms the logout request.
      sendSuccess(res, 200, "Logout successful", {});
    }
  );

  /**
   * @route   POST /api/v1/auth/forgot-password
   * @desc    Send password reset email
   * @access  Public
   */
  forgotPassword = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { email } = req.body;

      await authService.forgotPassword(email);

      sendSuccess(res, 200, "If the email exists, a password reset link has been sent.", {});
    }
  );

  /**
   * @route   POST /api/v1/auth/reset-password
   * @desc    Reset password using token
   * @access  Public
   */
  resetPassword = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { token, password } = req.body;

      await authService.resetPassword(token, password);

      sendSuccess(res, 200, "Password reset successful. You can now login with your new password.", {});
    }
  );
}

export default new AuthController();
