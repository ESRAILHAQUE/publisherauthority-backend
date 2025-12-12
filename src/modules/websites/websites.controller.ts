import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import websitesService from './websites.service';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';

/**
 * Websites Controller
 */
class WebsitesController {
  /**
   * @route   POST /api/v1/websites
   * @desc    Add single website
   * @access  Private (Publisher)
   */
  addWebsite = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const website = await websitesService.addWebsite(userId, req.body);

    sendSuccess(res, 201, 'Website submitted successfully', { website });
  });

  /**
   * @route   POST /api/v1/websites/bulk
   * @desc    Bulk add websites
   * @access  Private (Publisher)
   */
  bulkAddWebsites = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { websites } = req.body;

    const addedWebsites = await websitesService.bulkAddWebsites(userId, websites);

    sendSuccess(res, 201, 'Websites submitted successfully', {
      count: addedWebsites.length,
      websites: addedWebsites,
    });
  });

  /**
   * @route   GET /api/v1/websites
   * @desc    Get user's websites
   * @access  Private (Publisher)
   */
  getUserWebsites = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { status } = req.query;

    const filters: any = {};
    if (status) filters.status = status;

    const websites = await websitesService.getUserWebsites(userId, filters);

    sendSuccess(res, 200, 'Websites retrieved successfully', {
      count: websites.length,
      websites,
    });
  });

  /**
   * @route   GET /api/v1/websites/:id
   * @desc    Get website by ID
   * @access  Private (Publisher)
   */
  getWebsiteById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const website = await websitesService.getWebsiteById(id, userId);

    sendSuccess(res, 200, 'Website retrieved successfully', { website });
  });

  /**
   * @route   PUT /api/v1/websites/:id
   * @desc    Update website
   * @access  Private (Publisher)
   */
  updateWebsite = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const website = await websitesService.updateWebsite(id, userId, req.body);

    sendSuccess(res, 200, 'Website updated successfully', { website });
  });

  /**
   * @route   DELETE /api/v1/websites/:id
   * @desc    Delete website
   * @access  Private (Publisher)
   */
  deleteWebsite = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;

    await websitesService.deleteWebsite(id, userId);

    sendSuccess(res, 200, 'Website deleted successfully', null);
  });

  /**
   * @route   POST /api/v1/websites/:id/counter-offer/respond
   * @desc    Respond to counter offer
   * @access  Private (Publisher)
   */
  respondToCounterOffer = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { accept } = req.body;

    const website = await websitesService.respondToCounterOffer(id, userId, accept);

    sendSuccess(res, 200, `Counter offer ${accept ? 'accepted' : 'rejected'}`, { website });
  });

  /**
   * @route   POST /api/v1/websites/:id/counter-offer
   * @desc    Send counter offer (User)
   * @access  Private (Publisher)
   */
  sendCounterOffer = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { price, notes, terms } = req.body;

    if (!price || price <= 0) {
      res.status(400).json({
        success: false,
        message: 'Price is required and must be greater than 0',
      });
      return;
    }

    const website = await websitesService.sendUserCounterOffer(id, userId, { price, notes, terms });

    sendSuccess(res, 200, 'Counter offer sent successfully', { website });
  });

  /**
   * @route   POST /api/v1/websites/:id/verify/tag
   * @desc    Submit tag verification
   * @access  Private (Publisher)
   */
  submitTagVerification = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const website = await websitesService.submitVerification(id, userId, 'tag');

    sendSuccess(res, 200, 'Verification submitted successfully. Status is pending and admin will manually check.', { website });
  });

  /**
   * @route   POST /api/v1/websites/:id/verify/article
   * @desc    Submit article verification
   * @access  Private (Publisher)
   */
  submitArticleVerification = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { articleUrl } = req.body;

    if (!articleUrl || typeof articleUrl !== 'string' || articleUrl.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Article URL is required',
      });
      return;
    }

    const website = await websitesService.submitVerification(id, userId, 'article', articleUrl.trim());

    sendSuccess(res, 200, 'Verification submitted successfully. Status is pending and admin will manually check.', { website });
  });
}

export default new WebsitesController();



