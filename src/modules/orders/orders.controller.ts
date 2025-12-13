import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import ordersService from './orders.service';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import AppError from '../../utils/AppError';

/**
 * Orders Controller
 */
class OrdersController {
  /**
   * @route   GET /api/v1/orders
   * @desc    Get publisher's orders
   * @access  Private (Publisher)
   */
  getPublisherOrders = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const publisherId = req.user!.id;
    const { status, page = 1, limit = 20 } = req.query;

    const filters: any = {};
    if (status) filters.status = status;

    const result = await ordersService.getPublisherOrders(
      publisherId,
      filters,
      Number(page),
      Number(limit)
    );

    sendSuccess(res, 200, 'Orders retrieved successfully', result);
  });

  /**
   * @route   GET /api/v1/orders/:id
   * @desc    Get order by ID
   * @access  Private (Publisher)
   */
  getOrderById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const publisherId = req.user!.id;
    const { id } = req.params;

    const order = await ordersService.getOrderById(id, publisherId);

    sendSuccess(res, 200, 'Order retrieved successfully', { order });
  });

  /**
   * @route   POST /api/v1/orders/:id/submit
   * @desc    Submit post URL
   * @access  Private (Publisher)
   */
  submitPostUrl = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const publisherId = req.user!.id;
    const { id } = req.params;
    const { submittedUrl } = req.body;

    if (!submittedUrl) {
      throw new AppError('Submitted URL is required', 400);
    }

    const order = await ordersService.submitPostUrl(id, publisherId, submittedUrl);

    sendSuccess(res, 200, 'Post URL submitted successfully', { order });
  });

  /**
   * @route   POST /api/v1/orders/:id/approve
   * @desc    Approve order topic (moves from pending to ready-to-post)
   * @access  Private (Publisher)
   */
  approveOrderTopic = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const publisherId = req.user!.id;
    const { id } = req.params;

    const order = await ordersService.approveOrderTopic(id, publisherId);

    sendSuccess(res, 200, 'Order topic approved successfully. Order is now ready to post.', { order });
  });

  /**
   * @route   GET /api/v1/orders/stats
   * @desc    Get order statistics
   * @access  Private (Publisher)
   */
  getOrderStats = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const publisherId = req.user!.id;

    const stats = await ordersService.getOrderStats(publisherId);

    sendSuccess(res, 200, 'Order statistics retrieved successfully', stats);
  });
}

export default new OrdersController();

