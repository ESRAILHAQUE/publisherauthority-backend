import { Request, Response, NextFunction } from 'express';
import applicationsService from './applications.service';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';

/**
 * Applications Controller
 */
class ApplicationsController {
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



