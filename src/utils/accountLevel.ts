import User from '../modules/auth/auth.model';
import logger from './logger';

/**
 * Account Level Auto-Update Utility
 * Automatically updates user account level based on completed orders and active websites
 */

// Level requirements for reference (used in comments and documentation)
// Silver: 0-49 orders, 30+ active websites
// Gold: 50-149 orders, 100+ active websites
// Premium: 150-300 orders, 500+ active websites

/**
 * Calculate account level based on completed orders and active websites
 * 
 * Silver: 0–49 orders completed (30 Active website)
 * Gold: 50–149 orders completed (100 Active website)
 * Premium: 150–300 orders completed (500 Active website)
 */
export function calculateAccountLevel(
  completedOrders: number,
  activeWebsites: number
): 'silver' | 'gold' | 'premium' {
  // Premium level requirements: 150-300 orders AND 500 active websites
  if (
    completedOrders >= 150 &&
    completedOrders <= 300 &&
    activeWebsites >= 500
  ) {
    return 'premium';
  }

  // Gold level requirements: 50-149 orders AND 100 active websites
  if (
    completedOrders >= 50 &&
    completedOrders < 150 &&
    activeWebsites >= 100
  ) {
    return 'gold';
  }

  // Silver level requirements: 0-49 orders AND 30 active websites
  // If user has less than 30 active websites, they remain at silver (default)
  if (activeWebsites >= 30) {
    return 'silver';
  }

  // Default to silver (even if they don't meet the 30 websites requirement yet)
  return 'silver';
}

/**
 * Auto-update account level for a user
 */
export async function autoUpdateAccountLevel(userId: string): Promise<void> {
  try {
    const user = await User.findById(userId);

    if (!user) {
      logger.warn(`User not found for account level update: ${userId}`);
      return;
    }

    // Calculate new level based on current stats
    const newLevel = calculateAccountLevel(
      user.completedOrders,
      user.activeWebsites
    );

    // Only update if level has changed
    if (user.accountLevel !== newLevel) {
      await User.findByIdAndUpdate(userId, {
        accountLevel: newLevel,
      });

      logger.info(
        `Account level updated for user ${user.email}: ${user.accountLevel} -> ${newLevel}`
      );
    }
  } catch (error: any) {
    logger.error(`Error updating account level for user ${userId}:`, error);
  }
}

/**
 * Recalculate and update active websites count for a user
 */
export async function recalculateActiveWebsites(userId: string): Promise<void> {
  try {
    const Website = (await import('../modules/websites/websites.model')).default;
    const activeCount = await Website.countDocuments({
      userId,
      status: 'active',
    });

    await User.findByIdAndUpdate(userId, {
      activeWebsites: activeCount,
    });

    logger.info(`Recalculated active websites for user ${userId}: ${activeCount}`);
  } catch (error: any) {
    logger.error(
      `Error recalculating active websites for user ${userId}:`,
      error
    );
  }
}

/**
 * Recalculate and update completed orders count for a user
 */
export async function recalculateCompletedOrders(
  userId: string
): Promise<void> {
  try {
    const Order = (await import('../modules/orders/orders.model')).default;
    const completedCount = await Order.countDocuments({
      publisherId: userId,
      status: 'completed',
    });

    await User.findByIdAndUpdate(userId, {
      completedOrders: completedCount,
    });

    logger.info(
      `Recalculated completed orders for user ${userId}: ${completedCount}`
    );
  } catch (error: any) {
    logger.error(
      `Error recalculating completed orders for user ${userId}:`,
      error
    );
  }
}

