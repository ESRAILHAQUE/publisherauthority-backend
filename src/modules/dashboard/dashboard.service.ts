import User from '../auth/auth.model';
import Website from '../websites/websites.model';
import Order from '../orders/orders.model';
import Payment from '../payments/payments.model';
import AppError from '../../utils/AppError';

/**
 * Dashboard Service
 * Publisher dashboard statistics and data
 */
class DashboardService {
  /**
   * Get Publisher Dashboard Stats
   */
  async getPublisherDashboard(userId: string) {
    const user = await User.findById(userId).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get counts
    const [
      totalWebsites,
      activeWebsites,
      pendingWebsites,
      counterOfferWebsites,
      totalOrders,
      pendingOrders,
      readyToPostOrders,
      verifyingOrders,
      completedOrders,
      totalEarnings,
      pendingPayments,
    ] = await Promise.all([
      Website.countDocuments({ userId }),
      Website.countDocuments({ userId, status: 'active' }),
      Website.countDocuments({ userId, status: 'pending' }),
      Website.countDocuments({ userId, status: 'counter-offer' }),
      Order.countDocuments({ publisherId: userId }),
      Order.countDocuments({ publisherId: userId, status: 'pending' }),
      Order.countDocuments({ publisherId: userId, status: 'ready-to-post' }),
      Order.countDocuments({ publisherId: userId, status: 'verifying' }),
      Order.countDocuments({ publisherId: userId, status: 'completed' }),
      Payment.aggregate([
        { $match: { userId: user._id, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { userId: user._id, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    // Get recent orders with all necessary fields
    const recentOrders = await Order.find({ publisherId: userId })
      .populate('websiteId', 'url domainAuthority monthlyTraffic niche')
      .select('orderId title status deadline earnings submittedUrl createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get upcoming deadlines
    const upcomingDeadlines = await Order.find({
      publisherId: userId,
      status: { $in: ['pending', 'ready-to-post'] },
      deadline: { $gte: new Date() },
    })
      .populate('websiteId', 'url')
      .sort({ deadline: 1 })
      .limit(5)
      .lean();

    // Calculate level progress
    const levelProgress = this.calculateLevelProgress(
      user.accountLevel,
      user.completedOrders,
      user.activeWebsites
    );

    return {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountLevel: user.accountLevel,
        profileImage: user.profileImage,
      },
      stats: {
        totalEarnings: totalEarnings[0]?.total || user.totalEarnings || 0,
        pendingPayments: pendingPayments[0]?.total || 0,
        websites: {
          total: totalWebsites,
          active: activeWebsites,
          pending: pendingWebsites,
          counterOffers: counterOfferWebsites,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          readyToPost: readyToPostOrders,
          verifying: verifyingOrders,
          completed: completedOrders,
          counterOffers: counterOfferWebsites,
        },
        counterOffers: counterOfferWebsites,
      },
      levelProgress,
      recentOrders,
      upcomingDeadlines,
    };
  }

  /**
   * Calculate Level Progress
   */
  private calculateLevelProgress(
    currentLevel: string,
    completedOrders: number,
    activeWebsites: number
  ) {

    let nextLevel = '';
    let ordersNeeded = 0;
    let websitesNeeded = 0;
    let progressPercentage = 0;

    if (currentLevel === 'silver') {
      nextLevel = 'gold';
      ordersNeeded = Math.max(0, 50 - completedOrders);
      websitesNeeded = Math.max(0, 30 - activeWebsites);
      progressPercentage = Math.min(100, (completedOrders / 50) * 100);
    } else if (currentLevel === 'gold') {
      nextLevel = 'premium';
      ordersNeeded = Math.max(0, 150 - completedOrders);
      websitesNeeded = Math.max(0, 100 - activeWebsites);
      progressPercentage = Math.min(100, ((completedOrders - 50) / 100) * 100);
    } else {
      nextLevel = 'premium';
      progressPercentage = 100;
    }

    return {
      currentLevel,
      nextLevel,
      ordersNeeded,
      websitesNeeded,
      progressPercentage: Math.round(progressPercentage),
      completedOrders,
      activeWebsites,
    };
  }
}

export default new DashboardService();

