import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import supportService from './support.service';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';

/**
 * Support Controller
 */
class SupportController {
  /**
   * @route   POST /api/v1/support/tickets
   * @desc    Create support ticket
   * @access  Private
   */
  createTicket = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { subject, message } = req.body;

    const ticket = await supportService.createTicket(userId, { subject, message });

    sendSuccess(res, 201, 'Support ticket created successfully', { ticket });
  });

  /**
   * @route   GET /api/v1/support/tickets
   * @desc    Get user's tickets
   * @access  Private
   */
  getUserTickets = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { status, page = 1, limit = 20 } = req.query;

    const filters: any = {};
    if (status) filters.status = status;

    const result = await supportService.getUserTickets(
      userId,
      filters,
      Number(page),
      Number(limit)
    );

    sendSuccess(res, 200, 'Support tickets retrieved successfully', result);
  });

  /**
   * @route   GET /api/v1/support/tickets/:id
   * @desc    Get ticket by ID
   * @access  Private
   */
  getTicketById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const ticket = await supportService.getTicketById(id, userId);

    sendSuccess(res, 200, 'Support ticket retrieved successfully', { ticket });
  });

  /**
   * @route   POST /api/v1/support/tickets/:id/messages
   * @desc    Add message to ticket
   * @access  Private
   */
  addMessage = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { message } = req.body;

    const ticket = await supportService.addMessage(id, userId, message);

    sendSuccess(res, 200, 'Message added successfully', { ticket });
  });
}

export default new SupportController();

