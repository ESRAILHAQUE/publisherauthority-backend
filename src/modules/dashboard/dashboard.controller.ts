import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import dashboardService from './dashboard.service';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';

/**
 * Dashboard Controller
 */
class DashboardController {
  /**
   * @route   GET /api/v1/dashboard
   * @desc    Get publisher dashboard
   * @access  Private (Publisher)
   */
  getPublisherDashboard = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;

    const dashboard = await dashboardService.getPublisherDashboard(userId);

    sendSuccess(res, 200, 'Dashboard data retrieved successfully', dashboard);
  });
}

export default new DashboardController();

