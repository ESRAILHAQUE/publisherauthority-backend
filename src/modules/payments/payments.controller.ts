import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import paymentsService from './payments.service';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import Order from '../orders/orders.model';

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

    console.log('Payments result:', result);

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

  /**
   * @route   GET /api/v1/payments/:id/download
   * @desc    Download invoice PDF
   * @access  Private (Publisher)
   */
  downloadInvoice = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const payment = await paymentsService.getPaymentById(id, userId);
    const user = await (await import('../auth/auth.model')).default.findById(userId).select('firstName lastName email');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Get order details if available
    const orders = payment.orderIds && payment.orderIds.length > 0
      ? await Order.find({ _id: { $in: payment.orderIds } }).select('orderId title earnings')
      : [];

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      payment,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      orders: orders.map((order: any) => ({
        orderId: order.orderId,
        title: order.title,
        earnings: order.earnings,
      })),
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${payment.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  });
}

export default new PaymentsController();



