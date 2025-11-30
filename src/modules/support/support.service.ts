import SupportTicket, { ISupportTicket } from './support.model';
import User from '../auth/auth.model';
import AppError from '../../utils/AppError';
import logger from '../../utils/logger';

/**
 * Support Service
 */
class SupportService {
  /**
   * Create Support Ticket
   */
  async createTicket(
    userId: string,
    ticketData: { subject: string; message: string }
  ): Promise<ISupportTicket> {
    const ticket = await SupportTicket.create({
      userId,
      subject: ticketData.subject,
      messages: [{
        sender: userId,
        message: ticketData.message,
        createdAt: new Date(),
      }],
      status: 'open',
      priority: 'medium',
    });

    logger.info(`Support ticket created: ${ticket.ticketNumber} by user ${userId}`);
    return ticket;
  }

  /**
   * Get User Tickets
   */
  async getUserTickets(
    userId: string,
    filters: any = {},
    page = 1,
    limit = 20
  ): Promise<{
    tickets: ISupportTicket[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const query = { userId, ...filters };

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SupportTicket.countDocuments(query);

    return {
      tickets,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Ticket by ID
   */
  async getTicketById(ticketId: string, userId?: string): Promise<ISupportTicket> {
    const query: any = { _id: ticketId };
    if (userId) {
      query.userId = userId;
    }

    const ticket = await SupportTicket.findOne(query)
      .populate('userId', 'firstName lastName email')
      .populate('messages.sender', 'firstName lastName role')
      .populate('assignedTo', 'firstName lastName');

    if (!ticket) {
      throw new AppError('Support ticket not found', 404);
    }

    return ticket;
  }

  /**
   * Add Message to Ticket
   */
  async addMessage(
    ticketId: string,
    userId: string,
    message: string
  ): Promise<ISupportTicket> {
    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      throw new AppError('Support ticket not found', 404);
    }

    // Check if user owns the ticket or is admin
    if (ticket.userId.toString() !== userId) {
      const user = await User.findById(userId);
      if (!user || user.role !== 'admin') {
        throw new AppError('You do not have permission to reply to this ticket', 403);
      }
    }

    ticket.messages.push({
      sender: userId as any,
      message,
      createdAt: new Date(),
    });

    // Update status to in-progress if it was open
    if (ticket.status === 'open') {
      ticket.status = 'in-progress';
    }

    await ticket.save();

    logger.info(`Message added to ticket: ${ticket.ticketNumber}`);
    return ticket;
  }

  /**
   * Update Ticket Status
   */
  async updateTicketStatus(ticketId: string, status: string): Promise<ISupportTicket> {
    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      throw new AppError('Support ticket not found', 404);
    }

    ticket.status = status as any;
    await ticket.save();

    logger.info(`Ticket status updated: ${ticket.ticketNumber} -> ${status}`);
    return ticket;
  }

  /**
   * Get All Tickets (Admin)
   */
  async getAllTickets(
    filters: any = {},
    page = 1,
    limit = 20
  ): Promise<{
    tickets: ISupportTicket[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const tickets = await SupportTicket.find(filters)
      .populate('userId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SupportTicket.countDocuments(filters);

    return {
      tickets,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Assign Ticket (Admin)
   */
  async assignTicket(ticketId: string, adminId: string): Promise<ISupportTicket> {
    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      throw new AppError('Support ticket not found', 404);
    }

    ticket.assignedTo = adminId as any;
    ticket.status = 'in-progress';
    await ticket.save();

    logger.info(`Ticket assigned: ${ticket.ticketNumber} to admin ${adminId}`);
    return ticket;
  }
}

export default new SupportService();

