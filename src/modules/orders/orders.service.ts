import Order, { IOrder } from './orders.model';
import User from '../auth/auth.model';
import Website from '../websites/websites.model';
import AppError from '../../utils/AppError';
import logger from '../../utils/logger';
import { autoUpdateAccountLevel } from '../../utils/accountLevel';
import { sendOrderAssignmentEmail, sendOrderCompletedEmail, sendOrderRevisionRequestedEmail, sendOrderCancelledEmail } from '../../utils/email';
import mongoose from 'mongoose';

/**
 * Orders Service
 */
class OrdersService {
  /**
   * Create Order (Admin)
   */
  async createOrder(orderData: Partial<IOrder>): Promise<IOrder> {
    // Validate publisherId
    if (!orderData.publisherId) {
      throw new AppError('Publisher ID is required', 400);
    }

    // Validate websiteId
    if (!orderData.websiteId) {
      throw new AppError('Website ID is required', 400);
    }

    logger.info('Creating order with publisherId:', orderData.publisherId, 'websiteId:', orderData.websiteId);

    // Verify publisher and website exist
    const publisher = await User.findById(orderData.publisherId);
    if (!publisher) {
      logger.error(`Publisher not found with ID: ${orderData.publisherId}`);
      throw new AppError('Publisher not found', 404);
    }

    const website = await Website.findById(orderData.websiteId);
    if (!website || website.status !== 'active') {
      logger.error(`Website not found or not active. ID: ${orderData.websiteId}, Status: ${website?.status || 'not found'}`);
      throw new AppError('Website not found or not active', 404);
    }

    // Verify website belongs to the publisher
    const websiteUserId = website.userId?.toString();
    const publisherIdStr = publisher._id.toString();
    if (websiteUserId !== publisherIdStr) {
      logger.error(`Website userId (${websiteUserId}) does not match publisherId (${publisherIdStr})`);
      throw new AppError('Website does not belong to the specified publisher', 400);
    }

    // Remove orderId from orderData if present (it will be auto-generated)
    const { orderId, ...orderDataWithoutId } = orderData;
    
    // Generate orderId before creating
    const count = await Order.countDocuments();
    const generatedOrderId = `ORD-${Date.now()}-${count + 1}`;
    
    // Ensure deadline is a Date object if it's a string
    let deadline: Date;
    if (orderDataWithoutId.deadline instanceof Date) {
      deadline = orderDataWithoutId.deadline;
    } else if (typeof orderDataWithoutId.deadline === 'string') {
      deadline = new Date(orderDataWithoutId.deadline);
      if (isNaN(deadline.getTime())) {
        throw new AppError('Invalid deadline date format', 400);
      }
    } else {
      throw new AppError('Deadline is required', 400);
    }
    
    const orderDataToCreate = {
      ...orderDataWithoutId,
      orderId: generatedOrderId,
      deadline,
      status: 'pending' as const, // Order starts as pending, user needs to approve topic
    };
    
    logger.info('Creating order with data:', {
      orderId: generatedOrderId,
      title: orderDataToCreate.title,
      websiteId: orderDataToCreate.websiteId,
      websiteIdType: typeof orderDataToCreate.websiteId,
      publisherId: orderDataToCreate.publisherId,
      publisherIdType: typeof orderDataToCreate.publisherId,
      publisherIdString: String(orderDataToCreate.publisherId),
      anchorText: orderDataToCreate.anchorText,
      targetUrl: orderDataToCreate.targetUrl,
      deadline: deadline.toISOString(),
      earnings: orderDataToCreate.earnings,
      hasContent: !!orderDataToCreate.content,
      contentLength: orderDataToCreate.content?.length || 0,
    });
    
    const order = await Order.create(orderDataToCreate);

    // Verify the order was created with correct publisherId
    const createdOrder = await Order.findById(order._id);
    logger.info(`Order created successfully:`, {
      orderId: order.orderId,
      orderMongoId: order._id.toString(),
      storedPublisherId: createdOrder?.publisherId?.toString(),
      expectedPublisherId: publisher._id.toString(),
      publisherEmail: publisher.email,
      websiteId: order.websiteId.toString(),
      status: order.status
    });
    
    // Populate website for email
    const populatedOrder = await Order.findById(order._id)
      .populate('websiteId', 'url')
      .populate('publisherId', 'firstName lastName email');
    
    // Send order assignment email with full details
    try {
      const websiteUrl = populatedOrder && (populatedOrder.websiteId as any)?.url 
        ? (populatedOrder.websiteId as any).url 
        : '';
      
      await sendOrderAssignmentEmail(
        publisher.email,
        `${publisher.firstName} ${publisher.lastName}`,
        order.title,
        order.orderId,
        websiteUrl,
        order.targetUrl,
        order.anchorText,
        order.content
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

    // Convert publisherId to ObjectId to ensure proper matching
    let publisherObjectId: mongoose.Types.ObjectId;
    try {
      publisherObjectId = new mongoose.Types.ObjectId(publisherId);
    } catch (error) {
      logger.error(`Invalid publisherId format: ${publisherId}`, error);
      throw new AppError('Invalid publisher ID format', 400);
    }

    const query = { 
      publisherId: publisherObjectId, 
      ...filters 
    };

    logger.info(`Fetching orders for publisher: ${publisherId} (ObjectId: ${publisherObjectId})`);
    
    const orders = await Order.find(query)
      .populate('websiteId', 'url domainAuthority')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    logger.info(`Found ${orders.length} orders out of ${total} total for publisher ${publisherId}`);

    return {
      orders,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Approve Order Topic (Publisher)
   * Moves order from pending to ready-to-post
   */
  async approveOrderTopic(orderId: string, publisherId: string): Promise<IOrder> {
    const order = await Order.findOne({ _id: orderId, publisherId });
    
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    
    if (order.status !== 'pending') {
      throw new AppError(`Order cannot be approved. Current status: ${order.status}`, 400);
    }
    
    order.status = 'ready-to-post';
    await order.save();
    
    logger.info(`Order ${order.orderId} topic approved by publisher ${publisherId}`);
    
    return order;
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

    // Allow submission for both 'ready-to-post' and 'revision-requested' statuses
    const isRevisionResubmission = order.status === 'revision-requested';
    if (order.status !== 'ready-to-post' && !isRevisionResubmission) {
      throw new AppError('Order is not ready for submission', 400);
    }

    order.submittedUrl = submittedUrl;
    order.submittedAt = new Date();
    order.status = 'verifying';
    // Clear revision notes when resubmitting after revision request
    if (isRevisionResubmission) {
      order.revisionNotes = undefined;
    }
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

