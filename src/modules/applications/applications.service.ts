import Application, { IApplication } from './applications.model';
import User from '../auth/auth.model';
import AppError from '../../utils/AppError';
import logger from '../../utils/logger';
import bcrypt from 'bcryptjs';
import { sendApplicationApprovalEmail, sendApplicationRejectionEmail } from '../../utils/email';

/**
 * Applications Service
 */
class ApplicationsService {
  /**
   * Submit Application
   */
  async submitApplication(applicationData: Partial<IApplication>): Promise<IApplication> {
    // Check if email already exists
    const existingApplication = await Application.findOne({ email: applicationData.email });
    if (existingApplication) {
      throw new AppError('Application already submitted with this email', 400);
    }

    const existingUser = await User.findOne({ email: applicationData.email });
    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    // Ensure guestPostUrls is an array and filter out empty values
    if (applicationData.guestPostUrls) {
      applicationData.guestPostUrls = applicationData.guestPostUrls.filter(
        (url: string) => url && url.trim() !== ''
      );
    }

    // Hash password
    if (applicationData.password) {
      const salt = await bcrypt.genSalt(10);
      applicationData.password = await bcrypt.hash(applicationData.password, salt);
    }

    const application = await Application.create(applicationData);

    logger.info(`New application submitted: ${application.email}`);
    return application;
  }

  /**
   * Get All Applications (Admin)
   */
  async getAllApplications(
    filters: any = {},
    page = 1,
    limit = 20
  ): Promise<{
    applications: IApplication[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const applications = await Application.find(filters)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments(filters);

    return {
      applications,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Application by ID (Admin)
   */
  async getApplicationById(applicationId: string): Promise<IApplication> {
    const application = await Application.findById(applicationId);

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    return application;
  }

  /**
   * Approve Application (Admin)
   */
  async approveApplication(
    applicationId: string,
    reviewedBy: string
  ): Promise<{ application: IApplication; user: any }> {
    const application = await Application.findById(applicationId).select('+password');

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.status !== 'pending') {
      throw new AppError('Application has already been reviewed', 400);
    }

    // Create user account
    const user = await User.create({
      firstName: application.firstName,
      lastName: application.lastName,
      email: application.email,
      password: application.password,
      country: application.country,
      role: 'publisher',
      accountLevel: 'silver',
      accountStatus: 'active',
      applicationStatus: 'approved',
      isActive: true,
      isVerified: true,
    });

    // Update application
    application.status = 'approved';
    application.reviewedAt = new Date();
    application.reviewedBy = reviewedBy as any;
    application.userId = user._id;
    await application.save();

    logger.info(`Application approved: ${application.email}, User created: ${user._id}`);
    
    // Send approval email
    try {
      await sendApplicationApprovalEmail(
        user.email,
        `${user.firstName} ${user.lastName}`
      );
    } catch (emailError: any) {
      logger.error('Failed to send approval email:', emailError);
      // Don't fail the approval if email fails
    }
    
    return { application, user };
  }

  /**
   * Reject Application (Admin)
   */
  async rejectApplication(
    applicationId: string,
    reviewedBy: string,
    rejectionReason: string
  ): Promise<IApplication> {
    const application = await Application.findById(applicationId);

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.status !== 'pending') {
      throw new AppError('Application has already been reviewed', 400);
    }

    application.status = 'rejected';
    application.reviewedAt = new Date();
    application.reviewedBy = reviewedBy as any;
    application.rejectionReason = rejectionReason;
    await application.save();

    logger.info(`Application rejected: ${application.email}`);
    
    // Send rejection email
    try {
      await sendApplicationRejectionEmail(
        application.email,
        `${application.firstName} ${application.lastName}`,
        rejectionReason
      );
    } catch (emailError: any) {
      logger.error('Failed to send rejection email:', emailError);
      // Don't fail the rejection if email fails
    }
    
    return application;
  }

  /**
   * Get Application Statistics
   */
  async getApplicationStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'approved' }),
      Application.countDocuments({ status: 'rejected' }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }
}

export default new ApplicationsService();



