import Order, { IOrder } from './orders.model';
import User from '../auth/auth.model';
import Website from '../websites/websites.model';
import AppError from '../../utils/AppError';
import logger from '../../utils/logger';
import { autoUpdateAccountLevel } from '../../utils/accountLevel';
import { sendOrderAssignmentEmail, sendOrderCompletedEmail, sendOrderRevisionRequestedEmail, sendOrderCancelledEmail } from '../../utils/email';

/**
 * Orders Service
 */
class OrdersService {
  /**
   * Create Order (Admin)
   */
  async createOrder(orderData: Partial<IOrder>): Promise<IOrder> {
    // Verify publisher and website exist
    const publisher = await User.findById(orderData.publisherId);
    if (!publisher) {
      throw new AppError('Publisher not found', 404);
    }

    const website = await Website.findById(orderData.websiteId);
    if (!website || website.status !== 'active') {
      throw new AppError('Website not found or not active', 404);
    }

    const order = await Order.create({
      ...orderData,
      status: 'ready-to-post',
    });

    logger.info(`Order created: ${order.orderId} for publisher ${publisher.email}`);
    
    // Send order assignment email
    try {
      await sendOrderAssignmentEmail(
        publisher.email,
        `${publisher.firstName} ${publisher.lastName}`,
        order.title,
        order.orderId
      );
    } catch (emailError: any) {
      logger.error('Failed to send order assignment email:', emailError);
      // Don't fail order creation if email fails
    }
    
    return order;
  }

  /**
   * Get Publisher Orders
   */
  async getPublisherOrders(
    publisherId: string,
    filters: any = {},
    page = 1,
    limit = 20
  ): Promise<{
    orders: IOrder[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const query = { publisherId, ...filters };

    const orders = await Order.find(query)
      .populate('websiteId', 'url domainAuthority')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    return {
      orders,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Order by ID
   */
  async getOrderById(orderId: string, publisherId?: string): Promise<IOrder> {
    const query: any = { _id: orderId };
    if (publisherId) {
      query.publisherId = publisherId;
    }

    const order = await Order.findOne(query)
      .populate('publisherId', 'firstName lastName email')
      .populate('websiteId', 'url domainAuthority');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  /**
   * Submit Post URL (Publisher)
   */
  async submitPostUrl(
    orderId: string,
    publisherId: string,
    submittedUrl: string
  ): Promise<IOrder> {
    const order = await Order.findOne({ _id: orderId, publisherId });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'ready-to-post') {
      throw new AppError('Order is not ready for submission', 400);
    }

    order.submittedUrl = submittedUrl;
    order.submittedAt = new Date();
    order.status = 'verifying';
    await order.save();

    logger.info(`Post URL submitted for order: ${order.orderId}`);
    return order;
  }

  /**
   * Update Order Status
   */
  async updateOrderStatus(
    orderId: string,
    status: string,
    notes?: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId).populate('publisherId', 'email firstName lastName');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    order.status = status as any;

    if (status === 'completed') {
      order.completedAt = new Date();
      
      // Update publisher earnings and completed orders
      await User.findByIdAndUpdate(order.publisherId, {
        $inc: {
          totalEarnings: order.earnings,
          completedOrders: 1,
        },
      });

      // Auto-update account level based on new completed orders count
      await autoUpdateAccountLevel(order.publisherId.toString());

      // Send order completed email
      try {
        const publisher = order.publisherId as any;
        if (publisher && publisher.email) {
          await sendOrderCompletedEmail(
            publisher.email,
            `${publisher.firstName} ${publisher.lastName}`,
            order.title,
            order.orderId,
            order.earnings
          );
        }
      } catch (emailError: any) {
        logger.error('Failed to send order completed email:', emailError);
      }
    }

    if (status === 'revision-requested' && notes) {
      order.revisionNotes = notes;
      
      // Send revision requested email
      try {
        const publisher = order.publisherId as any;
        if (publisher && publisher.email) {
          await sendOrderRevisionRequestedEmail(
            publisher.email,
            `${publisher.firstName} ${publisher.lastName}`,
            order.title,
            order.orderId,
            notes
          );
        }
      } catch (emailError: any) {
        logger.error('Failed to send revision requested email:', emailError);
      }
    }

    if (status === 'cancelled') {
      // Send order cancelled email
      try {
        const publisher = order.publisherId as any;
        if (publisher && publisher.email) {
          await sendOrderCancelledEmail(
            publisher.email,
            `${publisher.firstName} ${publisher.lastName}`,
            order.title,
            order.orderId,
            notes
          );
        }
      } catch (emailError: any) {
        logger.error('Failed to send order cancelled email:', emailError);
      }
    }

    if (notes && status !== 'revision-requested') {
      order.verificationNotes = notes;
    }

    await order.save();

    logger.info(`Order status updated: ${order.orderId} -> ${status}`);
    return order;
  }

  /**
   * Get All Orders (Admin)
   */
  async getAllOrders(
    filters: any = {},
    page = 1,
    limit = 20
  ): Promise<{
    orders: IOrder[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const orders = await Order.find(filters)
      .populate('publisherId', 'firstName lastName email accountLevel')
      .populate('websiteId', 'url domainAuthority')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filters);

    return {
      orders,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Update Order (Admin)
   */
  async updateOrder(orderId: string, updateData: Partial<IOrder>): Promise<IOrder> {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    logger.info(`Order updated: ${order.orderId}`);
    return order;
  }

  /**
   * Get Order Statistics
   */
  async getOrderStats(publisherId?: string) {
    const query = publisherId ? { publisherId } : {};

    const [total, pending, readyToPost, verifying, completed, cancelled] = await Promise.all([
      Order.countDocuments(query),
      Order.countDocuments({ ...query, status: 'pending' }),
      Order.countDocuments({ ...query, status: 'ready-to-post' }),
      Order.countDocuments({ ...query, status: 'verifying' }),
      Order.countDocuments({ ...query, status: 'completed' }),
      Order.countDocuments({ ...query, status: 'cancelled' }),
    ]);

    return {
      total,
      pending,
      readyToPost,
      verifying,
      completed,
      cancelled,
    };
  }
}

export default new OrdersService();

