import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import paymentsService from './payments.service';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';

/**
 * Payments Controller
 */
class PaymentsController {
  /**
   * @route   GET /api/v1/payments
   * @desc    Get user's payments
   * @access  Private (Publisher)
   */
  getUserPayments = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { status, page = 1, limit = 20 } = req.query;

    const filters: any = {};
    if (status) filters.status = status;

    const result = await paymentsService.getUserPayments(
      userId,
      filters,
      Number(page),
      Number(limit)
    );

    sendSuccess(res, 200, 'Payments retrieved successfully', result);
  });

  /**
   * @route   GET /api/v1/payments/:id
   * @desc    Get payment by ID
   * @access  Private (Publisher)
   */
  getPaymentById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const payment = await paymentsService.getPaymentById(id, userId);

    sendSuccess(res, 200, 'Payment retrieved successfully', { payment });
  });

  /**
   * @route   PUT /api/v1/payments/settings
   * @desc    Update payment settings
   * @access  Private (Publisher)
   */
  updatePaymentSettings = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { paypalEmail } = req.body;

    const user = await paymentsService.updatePaymentSettings(userId, paypalEmail);

    sendSuccess(res, 200, 'Payment settings updated successfully', { user });
  });

  /**
   * @route   GET /api/v1/payments/stats
   * @desc    Get payment statistics
   * @access  Private (Publisher)
   */
  getPaymentStats = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;

    const stats = await paymentsService.getPaymentStats(userId);

    sendSuccess(res, 200, 'Payment statistics retrieved successfully', stats);
  });
}

export default new PaymentsController();

