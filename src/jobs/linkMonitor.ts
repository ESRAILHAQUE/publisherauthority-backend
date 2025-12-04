import cron from 'node-cron';
import Order from '../modules/orders/orders.model';
import logger from '../utils/logger';
import axios from 'axios';

/**
 * Link Monitoring Service
 * Checks if submitted URLs are still active
 */

interface LinkCheckResult {
  url: string;
  isActive: boolean;
  statusCode?: number;
  error?: string;
}

/**
 * Check if a URL is accessible
 */
async function checkLink(url: string): Promise<LinkCheckResult> {
  try {
    const response = await axios.head(url, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Accept all status codes < 500
    });

    return {
      url,
      isActive: response.status < 400,
      statusCode: response.status,
    };
  } catch (error: any) {
    logger.warn(`Link check failed for ${url}: ${error.message}`);
    return {
      url,
      isActive: false,
      error: error.message,
    };
  }
}

/**
 * Monitor all submitted order links
 */
async function monitorLinks(): Promise<void> {
  try {
    logger.info('Starting link monitoring job...');

    // Get all orders with submitted URLs that are completed
    const orders = await Order.find({
      status: 'completed',
      submittedUrl: { $exists: true, $ne: null },
    }).select('orderId submittedUrl publisherId');

    if (orders.length === 0) {
      logger.info('No links to monitor');
      return;
    }

    logger.info(`Checking ${orders.length} links...`);

    const results = await Promise.all(
      orders.map((order) => checkLink(order.submittedUrl!))
    );

    // Count inactive links
    const inactiveLinks = results.filter((r) => !r.isActive);
    
    if (inactiveLinks.length > 0) {
      logger.warn(`Found ${inactiveLinks.length} inactive links:`);
      inactiveLinks.forEach((result) => {
        logger.warn(`  - ${result.url} (Status: ${result.statusCode || 'Error'})`);
      });

      // TODO: Notify admins about inactive links
      // TODO: Update order status or flag for review
    } else {
      logger.info('All links are active ✓');
    }
  } catch (error: any) {
    logger.error('Error in link monitoring job:', error);
  }
}

/**
 * Start link monitoring cron job
 * Runs daily at 2 AM
 */
export function startLinkMonitoring(): void {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    await monitorLinks();
  });

  logger.info('Link monitoring cron job scheduled (daily at 2 AM)');
}

/**
 * Run link monitoring immediately (for testing)
 */
export async function runLinkMonitoringNow(): Promise<void> {
  await monitorLinks();
}

