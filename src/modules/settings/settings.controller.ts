import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import settingsService from './settings.service';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';

/**
 * Settings Controller
 */
class SettingsController {
  /**
   * @route   GET /api/v1/admin/settings
   * @desc    Get platform settings
   * @access  Private/Admin
   */
  getSettings = asyncHandler(async (_req: AuthRequest, res: Response, _next: NextFunction) => {
    const settings = await settingsService.getSettings();

    sendSuccess(res, 200, 'Settings retrieved successfully', { settings });
  });

  /**
   * @route   PUT /api/v1/admin/settings
   * @desc    Update platform settings
   * @access  Private/Admin
   */
  updateSettings = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { platformName, adminEmail, supportEmail, paymentSchedule, minimumPayout } = req.body;

    const updateData: any = {};
    if (platformName !== undefined) updateData.platformName = platformName;
    if (adminEmail !== undefined) updateData.adminEmail = adminEmail;
    if (supportEmail !== undefined) updateData.supportEmail = supportEmail;
    if (paymentSchedule !== undefined) updateData.paymentSchedule = paymentSchedule;
    if (minimumPayout !== undefined) updateData.minimumPayout = Number(minimumPayout);

    const settings = await settingsService.updateSettings(updateData);

    sendSuccess(res, 200, 'Settings updated successfully', { settings });
  });
}

export default new SettingsController();

