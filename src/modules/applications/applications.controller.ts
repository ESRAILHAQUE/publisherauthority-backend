import { Request, Response, NextFunction } from 'express';
import applicationsService from './applications.service';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { upload } from '../../utils/upload';
import path from 'path';
import fs from 'fs';

/**
 * Applications Controller
 */
class ApplicationsController {
  /**
   * @route   GET /api/v1/applications
   * @desc    Get applications (for checking status)
   * @access  Public (but typically used by authenticated users)
   */
  getApplications = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { email } = req.query;
    
    // If email is provided, get application by email (for status check)
    if (email) {
      const application = await applicationsService.getApplicationByEmail(email as string);
      if (!application) {
        return sendSuccess(res, 200, 'No application found', { application: null });
      }
      return sendSuccess(res, 200, 'Application retrieved successfully', { application });
    }

    // Otherwise return empty array since this is a public route
    return sendSuccess(res, 200, 'Applications retrieved successfully', { applications: [] });
  });

  /**
   * @route   GET /api/v1/applications/files/:filename
   * @desc    Download application file
   * @access  Public (for now, can be made private later)
   */
  downloadFile = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', 'applications', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: `File not found: ${filename}`,
      });
      return;
    }

    // Send file
    res.sendFile(filePath);
  });

  /**
   * @route   POST /api/v1/applications
   * @desc    Submit application (with file upload support)
   * @access  Public
   */
  submitApplication = (req: Request, res: Response, next: NextFunction): void => {
    // Handle file uploads if any
    const uploadMiddleware = upload.array('files', 10); // Allow up to 10 files
    
    uploadMiddleware(req, res, async (err: any) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
        return;
      }

      try {
        // Process uploaded files
        const files: any[] = [];
        if (req.files && Array.isArray(req.files)) {
          const { getFileUrl } = require('../../utils/upload');
          req.files.forEach((file: Express.Multer.File) => {
            files.push({
              filename: file.filename,
              originalName: file.originalname,
              path: getFileUrl(file.filename),
              size: file.size,
              mimetype: file.mimetype,
              uploadedAt: new Date(),
            });
          });
        }

        // Add files to application data
        const applicationData: any = {
          ...req.body,
        };
        
        if (files.length > 0) {
          applicationData.files = files;
        }

        // Parse JSON fields if they are strings
        if (typeof applicationData.guestPostUrls === 'string') {
          try {
            applicationData.guestPostUrls = JSON.parse(applicationData.guestPostUrls);
          } catch (e) {
            // If not JSON, keep as is
          }
        }
        if (typeof applicationData.quizAnswers === 'string') {
          try {
            applicationData.quizAnswers = JSON.parse(applicationData.quizAnswers);
          } catch (e) {
            // If not JSON, keep as is
          }
        }

        const application = await applicationsService.submitApplication(applicationData);

        sendSuccess(res, 201, 'Application submitted successfully. We will review it shortly.', {
          application: {
            id: application._id,
            email: application.email,
            status: application.status,
          },
        });
      } catch (error: any) {
        // Clean up uploaded files if application creation fails
        if (req.files && Array.isArray(req.files)) {
          const fs = require('fs');
          const path = require('path');
          req.files.forEach((file: Express.Multer.File) => {
            const filePath = path.join(process.cwd(), 'uploads', 'applications', file.filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });
        }
        next(error);
      }
    });
  };

  /**
   * @route   GET /api/v1/applications/verify-email
   * @desc    Verify email address using token
   * @access  Public
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    try {
      const application = await applicationsService.verifyEmail(token);
      
      return sendSuccess(res, 200, 'Email verified successfully. Your application is now under review.', {
        application: {
          id: application._id,
          email: application.email,
          emailVerified: application.emailVerified,
          status: application.status,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid or expired verification token',
      });
    }
  });
}

export default new ApplicationsController();
