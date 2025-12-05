import User from '../auth/auth.model';
import Website from '../websites/websites.model';
import Order from '../orders/orders.model';
import Payment from '../payments/payments.model';
import Application from '../applications/applications.model';
import SupportTicket from '../support/support.model';
import AppError from '../../utils/AppError';
import logger from '../../utils/logger';

/**
 * Admin Service
 * All admin-specific business logic
 */
class AdminService {
  /**
   * Get Dashboard Statistics
   */
  async getDashboardStats() {
    const [
      totalPublishers,
      activePublishers,
      totalWebsites,
      pendingWebsites,
      activeWebsites,
      totalOrders,
      activeOrders,
      completedOrders,
      totalPayments,
      pendingPayments,
      totalEarnings,
      pendingApplications,
      openTickets,
    ] = await Promise.all([
      User.countDocuments({ role: 'publisher' }),
      User.countDocuments({ role: 'publisher', accountStatus: 'active' }),
      Website.countDocuments(),
      Website.countDocuments({ status: 'pending' }),
      Website.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['pending', 'ready-to-post', 'verifying'] } }),
      Order.countDocuments({ status: 'completed' }),
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'pending' }),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Application.countDocuments({ status: 'pending' }),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in-progress'] } }),
    ]);

    return {
      publishers: {
        total: totalPublishers,
        active: activePublishers,
        suspended: totalPublishers - activePublishers,
      },
      websites: {
        total: totalWebsites,
        pending: pendingWebsites,
        active: activeWebsites,
      },
      orders: {
        total: totalOrders,
        active: activeOrders,
        completed: completedOrders,
      },
      payments: {
        total: totalPayments,
        pending: pendingPayments,
        totalEarnings: totalEarnings[0]?.total || 0,
      },
      applications: {
        pending: pendingApplications,
      },
      support: {
        openTickets,
      },
    };
  }

  /**
   * Get All Publishers
   */
  async getAllPublishers(
    filters: any = {},
    page = 1,
    limit = 20
  ): Promise<{
    publishers: any[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const publishers = await User.find({ role: 'publisher', ...filters })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: 'publisher', ...filters });

    // Auto-update account levels based on current stats
    const { autoUpdateAccountLevel } = await import('../../utils/accountLevel');
    await Promise.all(
      publishers.map((publisher) => 
        autoUpdateAccountLevel(publisher._id.toString()).catch((err) => {
          logger.error(`Failed to auto-update level for publisher ${publisher._id}:`, err);
        })
      )
    );

    // Refresh publishers to get updated levels
    const updatedPublishers = await User.find({ role: 'publisher', ...filters })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      publishers: updatedPublishers,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Publisher Details
   */
  async getPublisherDetails(publisherId: string) {
    const publisher = await User.findById(publisherId).select('-password');

    if (!publisher) {
      throw new AppError('Publisher not found', 404);
    }

    // Get publisher's websites, orders, and payments
    const [websites, orders, payments] = await Promise.all([
      Website.find({ userId: publisherId }),
      Order.find({ publisherId }).limit(10).sort({ createdAt: -1 }),
      Payment.find({ userId: publisherId }).limit(10).sort({ invoiceDate: -1 }),
    ]);

    return {
      publisher,
      websites,
      recentOrders: orders,
      recentPayments: payments,
    };
  }

  /**
   * Update Publisher Account Level
   */
  async updatePublisherLevel(publisherId: string, accountLevel: string) {
    const publisher = await User.findByIdAndUpdate(
      publisherId,
      { accountLevel },
      { new: true, runValidators: true }
    ).select('-password');

    if (!publisher) {
      throw new AppError('Publisher not found', 404);
    }

    logger.info(`Publisher level updated: ${publisher.email} -> ${accountLevel}`);
    return publisher;
  }

  /**
   * Update Publisher Status
   */
  async updatePublisherStatus(publisherId: string, accountStatus: string) {
    const publisher = await User.findByIdAndUpdate(
      publisherId,
      { accountStatus, isActive: accountStatus === 'active' },
      { new: true, runValidators: true }
    ).select('-password');

    if (!publisher) {
      throw new AppError('Publisher not found', 404);
    }

    logger.info(`Publisher status updated: ${publisher.email} -> ${accountStatus}`);
    return publisher;
  }

  /**
   * Get Recent Activity
   */
  async getRecentActivity(_limit = 20) {
    const [recentApplications, recentWebsites, recentOrders, recentPayments] = await Promise.all([
      Application.find().sort({ submittedAt: -1 }).limit(5),
      Website.find().sort({ submittedAt: -1 }).limit(5).populate('userId', 'firstName lastName email'),
      Order.find().sort({ assignedAt: -1 }).limit(5).populate('publisherId', 'firstName lastName'),
      Payment.find().sort({ invoiceDate: -1 }).limit(5).populate('userId', 'firstName lastName'),
    ]);

    return {
      applications: recentApplications,
      websites: recentWebsites,
      orders: recentOrders,
      payments: recentPayments,
    };
  }
}

export default new AdminService();

