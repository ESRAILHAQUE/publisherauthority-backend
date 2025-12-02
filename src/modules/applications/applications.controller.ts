import { Request, Response, NextFunction } from 'express';
import applicationsService from './applications.service';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';

/**
 * Applications Controller
 */
class ApplicationsController {
  /**
   * @route   GET /api/v1/applications
   * @desc    Get applications (for checking status)
   * @access  Public (but typically used by authenticated users)
   */
  getApplications = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { email, status } = req.query;
    
    // If email is provided, get application by email (for status check)
    if (email) {
      const application = await applicationsService.getApplicationByEmail(email as string);
      if (!application) {
        return sendSuccess(res, 200, 'No application found', { application: null });
      }
      return sendSuccess(res, 200, 'Application retrieved successfully', { application });
    }

    // Otherwise return empty or require admin auth
    // For now, return empty array since this is a public route
    sendSuccess(res, 200, 'Applications retrieved successfully', { applications: [] });
  });

  /**
   * @route   POST /api/v1/applications
   * @desc    Submit application
   * @access  Public
   */
  submitApplication = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const application = await applicationsService.submitApplication(req.body);

    sendSuccess(res, 201, 'Application submitted successfully. We will review it shortly.', {
      application: {
        id: application._id,
        email: application.email,
        status: application.status,
      },
    });
  });
}

export default new ApplicationsController();



