import Payment, { IPayment } from './payments.model';
import Order from '../orders/orders.model';
import User from '../auth/auth.model';
import AppError from '../../utils/AppError';
import logger from '../../utils/logger';
import { sendPaymentNotificationEmail } from '../../utils/email';
import mongoose from 'mongoose';

/**
 * Payments Service
 */
class PaymentsService {
  /**
   * Get User Payments
   */
  async getUserPayments(
    userId: string,
    filters: any = {},
    page = 1,
    limit = 20
  ): Promise<{
    payments: IPayment[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const query = { userId, ...filters };

    const payments = await Payment.find(query)
      .populate('orderIds', 'orderId title earnings')
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    console.log('User Payments Query:', query);

    return {
      payments,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Payment by ID
   */
  async getPaymentById(paymentId: string, userId?: string): Promise<IPayment> {
    const query: any = { _id: paymentId };
    if (userId) {
      query.userId = userId;
    }

    const payment = await Payment.findOne(query)
      .populate('userId', 'firstName lastName email paypalEmail paymentMethod')
      .populate('orderIds', 'orderId title earnings');

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    return payment;
  }

  /**
   * Update Payment Settings
   */
  async updatePaymentSettings(userId: string, paypalEmail: string, paymentMethod?: string): Promise<any> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paypalEmail.trim())) {
      throw new AppError('Invalid email format', 400);
    }

    // Validate payment method if provided
    const validPaymentMethods = ['PayPal', 'Bank Transfer', 'Wise', 'Payoneer', 'Other'];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      throw new AppError('Invalid payment method', 400);
    }

    const updateData: any = { paypalEmail: paypalEmail.trim().toLowerCase() };
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('paypalEmail paymentMethod firstName lastName email');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    logger.info(`Payment settings updated for user: ${userId}, email: ${user.paypalEmail}, method: ${user.paymentMethod || 'PayPal'}`);
    return user;
  }

  /**
   * Get Payment Statistics
   */
  async getPaymentStats(userId?: string) {
    const userObjectId = userId ? new mongoose.Types.ObjectId(userId) : undefined;
    const query = userObjectId ? { userId: userObjectId } : {};

    const orderMatch: any = { status: 'completed' };
    if (userObjectId) {
      orderMatch.publisherId = userObjectId;
    }

    const [
      totalPayments,
      pendingPayments,
      paidPayments,
      totalAmount,
      pendingAmount,
      paidAmount,
      completedOrders,
      completedEarnings,
    ] = await Promise.all([
      Payment.countDocuments(query),
      Payment.countDocuments({ ...query, status: 'pending' }),
      Payment.countDocuments({ ...query, status: 'paid' }),
      Payment.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { ...query, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { ...query, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Order.countDocuments(orderMatch),
      Order.aggregate([
        { $match: orderMatch },
        { $group: { _id: null, total: { $sum: '$earnings' } } },
      ]),
    ]);

    return {
      totalPayments,
      pendingPayments,
      paidPayments,
      totalAmount: totalAmount[0]?.total || 0,
      pendingAmount: pendingAmount[0]?.total || 0,
      paidAmount: paidAmount[0]?.total || 0,
      completedOrders,
      completedEarnings: completedEarnings[0]?.total || 0,
      awaitingPayout: Math.max(
        (completedEarnings[0]?.total || 0) - (paidAmount[0]?.total || 0),
        0
      ),
    };
  }

  /**
   * Create Payment/Invoice (Admin)
   */
  async createPayment(paymentData: Partial<IPayment>): Promise<IPayment> {
    const payment = await Payment.create(paymentData);

    logger.info(`Payment created: ${payment.invoiceNumber} for user ${payment.userId}`);
    return payment;
  }

  /**
   * Generate Invoice for Completed Orders (Admin)
   */
  async generateInvoice(userId: string, orderIds: string[]): Promise<IPayment> {
    // Verify all orders are completed
    const orders = await Order.find({
      _id: { $in: orderIds },
      publisherId: userId,
      status: 'completed',
    });

    if (orders.length !== orderIds.length) {
      throw new AppError('Some orders are not completed or not found', 400);
    }

    // Calculate total amount
    const totalAmount = orders.reduce((sum, order) => sum + order.earnings, 0);

    // Get user's PayPal email and payment method
    const user = await User.findById(userId).select('paypalEmail paymentMethod');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Create payment
    const payment = await Payment.create({
      userId,
      orderIds,
      amount: totalAmount,
      currency: 'USD',
      paymentMethod: user.paymentMethod || 'PayPal',
      paypalEmail: user.paypalEmail,
      invoiceDate: new Date(),
      dueDate: this.getNextPaymentDate(),
      status: 'pending',
      description: `Payment for ${orders.length} completed orders`,
    });

    logger.info(`Invoice generated: ${payment.invoiceNumber} for ${totalAmount} USD`);
    return payment;
  }

  /**
   * Process Payment (Admin)
   */
  async processPayment(paymentId: string): Promise<IPayment> {
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status !== 'pending') {
      throw new AppError('Payment is not in pending status', 400);
    }

    payment.status = 'processing';
    await payment.save();

    logger.info(`Payment processing: ${payment.invoiceNumber}`);
    return payment;
  }

  /**
   * Mark Payment as Paid (Admin)
   */
  async markAsPaid(paymentId: string): Promise<IPayment> {
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    payment.status = 'paid';
    payment.paymentDate = new Date();
    await payment.save();

    logger.info(`Payment marked as paid: ${payment.invoiceNumber}`);

    // Send payment notification email
    try {
      const user = await User.findById(payment.userId).select('firstName lastName email');
      if (user) {
        await sendPaymentNotificationEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          payment.amount,
          payment.invoiceNumber
        );
      }
    } catch (emailError: any) {
      logger.error('Failed to send payment notification email:', emailError);
      // Don't fail payment if email fails
    }

    return payment;
  }

  /**
   * Get All Payments (Admin)
   */
  async getAllPayments(
    filters: any = {},
    page = 1,
    limit = 20
  ): Promise<{
    payments: IPayment[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const payments = await Payment.find(filters)
      .populate('userId', 'firstName lastName email paypalEmail paymentMethod accountLevel')
      .populate('orderIds', 'orderId title')
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filters);

    return {
      payments,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Next Payment Date (1st or 15th of month)
   */
  private getNextPaymentDate(): Date {
    const now = new Date();
    const day = now.getDate();

    let paymentDate: Date;

    if (day < 1) {
      paymentDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (day < 15) {
      paymentDate = new Date(now.getFullYear(), now.getMonth(), 15);
    } else {
      paymentDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // If weekend, move to next business day
    const dayOfWeek = paymentDate.getDay();
    if (dayOfWeek === 0) { // Sunday
      paymentDate.setDate(paymentDate.getDate() + 1);
    } else if (dayOfWeek === 6) { // Saturday
      paymentDate.setDate(paymentDate.getDate() + 2);
    }

    return paymentDate;
  }
}

export default new PaymentsService();



