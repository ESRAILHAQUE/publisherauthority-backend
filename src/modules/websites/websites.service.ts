import Website, { IWebsite } from './websites.model';
import User from '../auth/auth.model';
import AppError from '../../utils/AppError';
import logger from '../../utils/logger';
import crypto from 'crypto';
import { autoUpdateAccountLevel } from '../../utils/accountLevel';

/**
 * Websites Service
 * Business logic for website management
 */
class WebsitesService {
  /**
   * Add Single Website
   */
  async addWebsite(userId: string, websiteData: Partial<IWebsite>): Promise<IWebsite> {
    // Generate verification code
    const verificationCode = crypto.randomBytes(32).toString('hex');

    const website = await Website.create({
      ...websiteData,
      userId,
      verificationCode,
      status: 'pending',
    });

    // Don't increment activeWebsites here - only when status becomes 'active'

    logger.info(`Website added: ${website.url} by user ${userId}`);
    return website;
  }

  /**
   * Bulk Add Websites (from CSV)
   */
  async bulkAddWebsites(userId: string, websitesData: Partial<IWebsite>[]): Promise<IWebsite[]> {
    const websites = await Promise.all(
      websitesData.map(async (data) => {
        const verificationCode = crypto.randomBytes(32).toString('hex');
        return Website.create({
          ...data,
          userId,
          verificationCode,
          status: 'pending',
        });
      })
    );

    // Don't increment activeWebsites here - only when status becomes 'active'

    logger.info(`Bulk added ${websites.length} websites for user ${userId}`);
    return websites;
  }

  /**
   * Get User Websites
   */
  async getUserWebsites(userId: string, filters: any = {}): Promise<IWebsite[]> {
    const websites = await Website.find({
      userId,
      ...filters,
    }).sort({ createdAt: -1 });

    return websites;
  }

  /**
   * Get Website by ID
   */
  async getWebsiteById(websiteId: string, userId?: string): Promise<IWebsite> {
    const query: any = { _id: websiteId };
    if (userId) {
      query.userId = userId;
    }

    const website = await Website.findOne(query).populate('userId', 'firstName lastName email');

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    return website;
  }

  /**
   * Update Website
   */
  async updateWebsite(
    websiteId: string,
    userId: string,
    updateData: Partial<IWebsite>
  ): Promise<IWebsite> {
    const website = await Website.findOne({ _id: websiteId, userId });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    // Only allow updates if status is pending or counter-offer
    if (!['pending', 'counter-offer'].includes(website.status)) {
      throw new AppError('Cannot update website in current status', 400);
    }

    Object.assign(website, updateData);
    await website.save();

    logger.info(`Website updated: ${website.url}`);
    return website;
  }

  /**
   * Delete Website
   */
  async deleteWebsite(websiteId: string, userId: string): Promise<void> {
    const website = await Website.findOne({ _id: websiteId, userId });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    // Only allow deletion if not active
    if (website.status === 'active') {
      throw new AppError('Cannot delete active website', 400);
    }

    website.status = 'deleted';
    await website.save();

    // Update user's active websites count
    await User.findByIdAndUpdate(userId, {
      $inc: { activeWebsites: -1 },
    });

    logger.info(`Website deleted: ${website.url}`);
  }

  /**
   * Verify Website (Admin)
   */
  async verifyWebsite(websiteId: string, method: 'tag' | 'article'): Promise<IWebsite> {
    const website = await Website.findById(websiteId);

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    const wasActive = website.status === 'active';
    website.verificationMethod = method;
    website.verifiedAt = new Date();
    website.status = 'active';
    website.approvedAt = new Date();
    await website.save();

    // If website wasn't active before, update user's active websites count and account level
    if (!wasActive) {
      await User.findByIdAndUpdate(website.userId, {
        $inc: { activeWebsites: 1 },
      });
      await autoUpdateAccountLevel(website.userId.toString());
    }

    logger.info(`Website verified: ${website.url}`);
    return website;
  }

  /**
   * Send Counter Offer (Admin)
   */
  async sendCounterOffer(
    websiteId: string,
    counterOfferData: { notes: string; terms: string }
  ): Promise<IWebsite> {
    const website = await Website.findById(websiteId);

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    website.status = 'counter-offer';
    website.counterOffer = {
      ...counterOfferData,
      status: 'pending',
    };
    await website.save();

    logger.info(`Counter offer sent for website: ${website.url}`);
    return website;
  }

  /**
   * Respond to Counter Offer (Publisher)
   */
  async respondToCounterOffer(
    websiteId: string,
    userId: string,
    accept: boolean
  ): Promise<IWebsite> {
    const website = await Website.findOne({ _id: websiteId, userId });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    if (website.status !== 'counter-offer' || !website.counterOffer) {
      throw new AppError('No counter offer available', 400);
    }

    website.counterOffer.status = accept ? 'accepted' : 'rejected';
    website.status = accept ? 'active' : 'rejected';
    
    if (accept) {
      website.approvedAt = new Date();
      
      // Website is becoming active, update user's active websites count and account level
      await User.findByIdAndUpdate(userId, {
        $inc: { activeWebsites: 1 },
      });
      await autoUpdateAccountLevel(userId);
    }

    await website.save();

    logger.info(`Counter offer ${accept ? 'accepted' : 'rejected'} for website: ${website.url}`);
    return website;
  }

  /**
   * Get All Websites (Admin)
   */
  async getAllWebsites(filters: any = {}, page = 1, limit = 20): Promise<{
    websites: IWebsite[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const websites = await Website.find(filters)
      .populate('userId', 'firstName lastName email accountLevel')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Website.countDocuments(filters);

    return {
      websites,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Update Website Status (Admin)
   */
  async updateWebsiteStatus(
    websiteId: string,
    status: string,
    rejectionReason?: string
  ): Promise<IWebsite> {
    const website = await Website.findById(websiteId);

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    website.status = status as any;
    
    if (status === 'rejected' && rejectionReason) {
      website.rejectedReason = rejectionReason;
    }

    const wasActive = website.status === 'active';
    
    if (status === 'active') {
      website.approvedAt = new Date();
      
      // If website wasn't active before, update user's active websites count and account level
      if (!wasActive) {
        await User.findByIdAndUpdate(website.userId, {
          $inc: { activeWebsites: 1 },
        });
        await autoUpdateAccountLevel(website.userId.toString());
      }
    } else if (wasActive && status !== 'active') {
      // If website was active but is being deactivated, decrease count
      await User.findByIdAndUpdate(website.userId, {
        $inc: { activeWebsites: -1 },
      });
      await autoUpdateAccountLevel(website.userId.toString());
    }

    await website.save();

    logger.info(`Website status updated: ${website.url} -> ${status}`);
    return website;
  }
}

export default new WebsitesService();



