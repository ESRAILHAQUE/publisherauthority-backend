import Website, { IWebsite } from './websites.model';
import User from '../auth/auth.model';
import AppError from '../../utils/AppError';
import logger from '../../utils/logger';
import crypto from 'crypto';
import { autoUpdateAccountLevel } from '../../utils/accountLevel';
import { emitAdminNotification, emitUserNotification } from '../../config/socket';
import { sendCounterOfferEmail, sendWebsiteApprovalEmail, sendWebsiteRejectionEmail, sendCounterOfferAcceptedEmail, sendCounterOfferRejectedEmail } from '../../utils/email';

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

    // Remove counterOffer from websiteData if it's not provided (to avoid validation issues)
    const { counterOffer, ...dataWithoutCounterOffer } = websiteData;

    const website = await Website.create({
      ...dataWithoutCounterOffer,
      userId,
      verificationCode,
      status: 'pending',
    });

    // Don't increment activeWebsites here - only when status becomes 'active'

    logger.info(`Website added: ${website.url} by user ${userId}`);
    
    // Emit notification to admin
    try {
      const user = await User.findById(userId).select('firstName lastName email');
      emitAdminNotification('website_added', {
        websiteId: website._id.toString(),
        url: website.url,
        price: website.price,
        userId: userId,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        userEmail: user?.email || 'Unknown',
      });
    } catch (error) {
      logger.error('Failed to emit website added notification:', error);
    }
    
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
  async getUserWebsites(userId: string, filters: any = {}): Promise<any[]> {
    const websites = await Website.find({
      userId,
      ...filters,
    })
      .populate('userId', 'firstName lastName email accountLevel')
      .sort({ createdAt: -1 })
      .lean();

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

    const website = await Website.findOne(query).populate('userId', 'firstName lastName email accountLevel');

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
      
      // Send website approval email
      try {
        const user = await User.findById(website.userId).select('firstName lastName email');
        if (user) {
          await sendWebsiteApprovalEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            website.url
          );
        }
      } catch (emailError: any) {
        logger.error('Failed to send website approval email:', emailError);
        // Don't fail the verification if email fails
      }
    }

    logger.info(`Website verified: ${website.url}`);
    return website;
  }

  /**
   * Send Counter Offer (Admin)
   */
  async sendCounterOffer(
    websiteId: string,
    counterOfferData: { price: number; notes?: string; terms?: string }
  ): Promise<IWebsite> {
    const website = await Website.findById(websiteId);

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    if (website.status !== 'pending' && website.status !== 'counter-offer') {
      throw new AppError('Cannot send counter offer for website in current status', 400);
    }

    website.status = 'counter-offer';
    website.counterOffer = {
      price: counterOfferData.price,
      notes: counterOfferData.notes || '',
      terms: counterOfferData.terms || '',
      offeredBy: 'admin',
      offeredAt: new Date(),
      status: 'pending',
    };
    await website.save();

    logger.info(`Counter offer sent by admin for website: ${website.url} - Price: $${counterOfferData.price}`);
    
    // Emit notification to user
    try {
      emitUserNotification(website.userId.toString(), 'counter_offer_received', {
        websiteId: website._id.toString(),
        url: website.url,
        price: counterOfferData.price,
        notes: counterOfferData.notes,
        terms: counterOfferData.terms,
      });
    } catch (error) {
      logger.error('Failed to emit counter offer notification:', error);
    }
    
    // Send counter offer email
    try {
      const user = await User.findById(website.userId).select('firstName lastName email');
      if (user) {
        await sendCounterOfferEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          website.url,
          counterOfferData.price,
          counterOfferData.notes
        );
      }
    } catch (emailError: any) {
      logger.error('Failed to send counter offer email:', emailError);
      // Don't fail the counter offer if email fails
    }
    
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

    if (website.counterOffer.status !== 'pending') {
      throw new AppError('Counter offer has already been responded to', 400);
    }

    website.counterOffer.status = accept ? 'accepted' : 'rejected';
    website.status = accept ? 'active' : 'rejected';
    
    if (accept) {
      // Update the website price to the accepted counter offer price
      website.price = website.counterOffer.price;
      website.approvedAt = new Date();
      
      // Website is becoming active, update user's active websites count and account level
      await User.findByIdAndUpdate(userId, {
        $inc: { activeWebsites: 1 },
      });
      await autoUpdateAccountLevel(userId);
      
      // Send counter offer accepted email
      try {
        const user = await User.findById(userId).select('firstName lastName email');
        if (user) {
          await sendCounterOfferAcceptedEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            website.url,
            website.counterOffer.price
          );
        }
      } catch (emailError: any) {
        logger.error('Failed to send counter offer accepted email:', emailError);
        // Don't fail the acceptance if email fails
      }
    } else {
      // Send counter offer rejected email
      try {
        const user = await User.findById(userId).select('firstName lastName email');
        if (user) {
          await sendCounterOfferRejectedEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            website.url
          );
        }
      } catch (emailError: any) {
        logger.error('Failed to send counter offer rejected email:', emailError);
        // Don't fail the rejection if email fails
      }
    }

    await website.save();

    logger.info(`Counter offer ${accept ? 'accepted' : 'rejected'} for website: ${website.url}`);
    
    // Emit notification to admin if accepted
    if (accept) {
      try {
        const user = await User.findById(userId).select('firstName lastName email');
        emitAdminNotification('counter_offer_accepted', {
          websiteId: website._id.toString(),
          url: website.url,
          price: website.price,
          userId: userId,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          userEmail: user?.email || 'Unknown',
        });
      } catch (error) {
        logger.error('Failed to emit counter offer accepted notification:', error);
      }
    }
    
    return website;
  }

  /**
   * Send Counter Offer (User/Publisher)
   */
  async sendUserCounterOffer(
    websiteId: string,
    userId: string,
    counterOfferData: { price: number; notes?: string; terms?: string }
  ): Promise<IWebsite> {
    const website = await Website.findOne({ _id: websiteId, userId });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    if (website.status !== 'counter-offer') {
      throw new AppError('Can only send counter offer when website is in counter-offer status', 400);
    }

    // Allow user to send counter offer even if there's a pending admin counter offer
    // User can either accept/reject admin's offer OR send their own counter offer
    // If user sends a counter offer, it replaces the previous one (if any)
    
    website.status = 'counter-offer';
    website.counterOffer = {
      price: counterOfferData.price,
      notes: counterOfferData.notes || '',
      terms: counterOfferData.terms || '',
      offeredBy: 'user',
      offeredAt: new Date(),
      status: 'pending',
    };
    await website.save();

    logger.info(`Counter offer sent by user for website: ${website.url} - Price: $${counterOfferData.price}`);
    
    // Emit notification to admin
    try {
      const user = await User.findById(userId).select('firstName lastName email');
      emitAdminNotification('user_counter_offer', {
        websiteId: website._id.toString(),
        url: website.url,
        price: counterOfferData.price,
        notes: counterOfferData.notes,
        terms: counterOfferData.terms,
        userId: userId,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        userEmail: user?.email || 'Unknown',
      });
    } catch (error) {
      logger.error('Failed to emit user counter offer notification:', error);
    }
    
    return website;
  }

  /**
   * Accept User Counter Offer (Admin)
   */
  async acceptUserCounterOffer(websiteId: string): Promise<IWebsite> {
    const website = await Website.findById(websiteId);

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    if (website.status !== 'counter-offer' || !website.counterOffer) {
      throw new AppError('No counter offer available', 400);
    }

    if (website.counterOffer.offeredBy !== 'user') {
      throw new AppError('This counter offer was not made by the user', 400);
    }

    if (website.counterOffer.status !== 'pending') {
      throw new AppError('Counter offer has already been responded to', 400);
    }

    // Update the website price to the accepted counter offer price
    // Since status is 'counter-offer', it's not active yet
    website.price = website.counterOffer.price;
    website.counterOffer.status = 'accepted';
    website.status = 'active';
    website.approvedAt = new Date();
    await website.save();

    // Website is becoming active, update user's active websites count and account level
    await User.findByIdAndUpdate(website.userId, {
      $inc: { activeWebsites: 1 },
    });
    await autoUpdateAccountLevel(website.userId.toString());
    
    // Send website approval email
    try {
      const user = await User.findById(website.userId).select('firstName lastName email');
      if (user) {
        await sendWebsiteApprovalEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          website.url
        );
      }
    } catch (emailError: any) {
      logger.error('Failed to send website approval email:', emailError);
      // Don't fail the acceptance if email fails
    }

    logger.info(`User counter offer accepted for website: ${website.url} - Price: $${website.price}`);
    
    // Emit notification to user
    try {
      emitUserNotification(website.userId.toString(), 'counter_offer_accepted', {
        websiteId: website._id.toString(),
        url: website.url,
        price: website.price,
      });
    } catch (error) {
      logger.error('Failed to emit counter offer accepted notification:', error);
    }
    
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
        
        // Send website approval email
        try {
          const user = await User.findById(website.userId).select('firstName lastName email');
          if (user) {
            await sendWebsiteApprovalEmail(
              user.email,
              `${user.firstName} ${user.lastName}`,
              website.url
            );
          }
        } catch (emailError: any) {
          logger.error('Failed to send website approval email:', emailError);
          // Don't fail the status update if email fails
        }
      }
    } else if (status === 'rejected') {
      // Send website rejection email
      try {
        const user = await User.findById(website.userId).select('firstName lastName email');
        if (user) {
          await sendWebsiteRejectionEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            website.url,
            rejectionReason
          );
        }
      } catch (emailError: any) {
        logger.error('Failed to send website rejection email:', emailError);
        // Don't fail the status update if email fails
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



