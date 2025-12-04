import User from '../modules/auth/auth.model';
import logger from './logger';

/**
 * Account Level Auto-Update Utility
 * Automatically updates user account level based on completed orders and active websites
 */

interface LevelRequirements {
  orders: number;
  websites: number;
}

const LEVEL_REQUIREMENTS: Record<string, LevelRequirements> = {
  silver: { orders: 0, websites: 0 },
  gold: { orders: 50, websites: 30 },
  premium: { orders: 150, websites: 100 },
};

/**
 * Calculate account level based on completed orders and active websites
 */
export function calculateAccountLevel(
  completedOrders: number,
  activeWebsites: number
): 'silver' | 'gold' | 'premium' {
  // Premium level requirements
  if (
    completedOrders >= LEVEL_REQUIREMENTS.premium.orders &&
    activeWebsites >= LEVEL_REQUIREMENTS.premium.websites
  ) {
    return 'premium';
  }

  // Gold level requirements
  if (
    completedOrders >= LEVEL_REQUIREMENTS.gold.orders &&
    activeWebsites >= LEVEL_REQUIREMENTS.gold.websites
  ) {
    return 'gold';
  }

  // Default to silver
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

