import nodemailer from "nodemailer";
import config from "../config/env";
import logger from "./logger";

/**
 * Email Service Utility
 * Handles sending emails using Nodemailer
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: config.EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send Email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // Validate email configuration
    if (!config.EMAIL_HOST || !config.EMAIL_USER || !config.EMAIL_PASSWORD) {
      const missing = [];
      if (!config.EMAIL_HOST) missing.push('EMAIL_HOST');
      if (!config.EMAIL_USER) missing.push('EMAIL_USER');
      if (!config.EMAIL_PASSWORD) missing.push('EMAIL_PASSWORD');
      
      logger.error(`Email configuration is incomplete. Missing: ${missing.join(', ')}. Email not sent to ${options.to}`);
      logger.error(`Please set email environment variables in .env file or ecosystem.config.js`);
      throw new Error(`Email configuration incomplete: Missing ${missing.join(', ')}`);
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: config.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${options.to}: ${info.messageId}`);
  } catch (error: any) {
    logger.error(`Failed to send email to ${options.to}:`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

/**
 * Send Welcome Email
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3F207F;">Welcome to Publisher Authority!</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for joining Publisher Authority. Your account has been successfully created.</p>
      <p>You can now start adding your websites and receiving orders for guest posting.</p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: "Welcome to Publisher Authority",
    html,
  });
}

/**
 * Send Application Welcome Email (After Email Verification)
 */
export async function sendApplicationWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #3F207F;">Welcome to PublisherAuthority!</h2>
      <p>Hello ${userName},</p>
      <p>Thank you for your interest in joining PublisherAuthority!</p>
      <p>We are currently reviewing your information and will update you within 7 days. Once approved, you'll be able to start adding sites for review.</p>
      <p>We appreciate your patience!</p>
      <p>Best regards,<br>The PublisherAuthority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: "Welcome to PublisherAuthority!",
    html,
  });
}

/**
 * Send Application Approval Email
 */
export async function sendApplicationApprovalEmail(
  userEmail: string,
  userName: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2EE6B7;">Application Approved!</h2>
      <p>Hi ${userName},</p>
      <p>Great news! Your publisher application has been approved.</p>
      <p>You can now log in to your account and start adding your websites.</p>
      <p><a href="${config.FRONTEND_URL}/auth/login" style="background-color: #3F207F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Your Account</a></p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: "Your Publisher Application Has Been Approved",
    html,
  });
}

/**
 * Send Application Rejection Email
 */
export async function sendApplicationRejectionEmail(
  userEmail: string,
  userName: string,
  reason?: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Application Status Update</h2>
      <p>Hi ${userName},</p>
      <p>We regret to inform you that your publisher application has not been approved at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: "Publisher Application Status Update",
    html,
  });
}

/**
 * Send Order Assignment Email
 */
export async function sendOrderAssignmentEmail(
  userEmail: string,
  userName: string,
  orderTitle: string,
  orderId: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3F207F;">New Order Assigned</h2>
      <p>Hi ${userName},</p>
      <p>A new order has been assigned to you:</p>
      <p><strong>Order:</strong> ${orderTitle}</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><a href="${config.FRONTEND_URL}/dashboard/orders/${orderId}" style="background-color: #3F207F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
      <p>Please check your dashboard for more details.</p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `New Order: ${orderTitle}`,
    html,
  });
}

/**
 * Send Payment Notification Email
 */
export async function sendPaymentNotificationEmail(
  userEmail: string,
  userName: string,
  amount: number,
  invoiceNumber: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2EE6B7;">Payment Processed</h2>
      <p>Hi ${userName},</p>
      <p>Your payment has been processed successfully.</p>
      <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
      <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p>You can download your invoice from your payments dashboard.</p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Payment Processed - Invoice ${invoiceNumber}`,
    html,
  });
}

/**
 * Send Application Submission Email (Email Verification)
 */
export async function sendApplicationVerificationEmail(
  userEmail: string,
  userName: string,
  verificationToken: string
): Promise<void> {
  const frontendUrl = config.FRONTEND_URL || 'https://publisherauthority.com';
  const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #3F207F;">Application Received - Verify Your Email</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for submitting your publisher application to Publisher Authority!</p>
      <p>To complete your application, please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #3F207F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email Address</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
      <p>Once your email is verified, our team will review your application. You will receive an email notification once your application has been reviewed.</p>
      <p>If you did not submit this application, please ignore this email.</p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: 'Verify Your Email - Publisher Authority Application',
    html,
  });
}

/**
 * Send Counter Offer Email
 */
export async function sendCounterOfferEmail(
  userEmail: string,
  userName: string,
  websiteUrl: string,
  counterOfferPrice: number,
  notes?: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3F207F;">Counter Offer Received</h2>
      <p>Hi ${userName},</p>
      <p>You have received a counter offer for your website: <strong>${websiteUrl}</strong></p>
      <p><strong>Counter Offer Price:</strong> $${counterOfferPrice.toFixed(2)}</p>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      <p><a href="${config.FRONTEND_URL}/dashboard/websites" style="background-color: #3F207F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Counter Offer</a></p>
      <p>Please log in to your dashboard to accept or reject this counter offer.</p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Counter Offer for ${websiteUrl}`,
    html,
  });
}

/**
 * Send Website Approval Email (Landing Approval)
 */
export async function sendWebsiteApprovalEmail(
  userEmail: string,
  userName: string,
  websiteUrl: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2EE6B7;">Website Approved!</h2>
      <p>Hi ${userName},</p>
      <p>Great news! Your website <strong>${websiteUrl}</strong> has been approved and is now active.</p>
      <p>You can now start receiving orders for this website. We will notify you whenever a new order is assigned to you.</p>
      <p><a href="${config.FRONTEND_URL}/dashboard/websites" style="background-color: #3F207F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Your Websites</a></p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Website Approved: ${websiteUrl}`,
    html,
  });
}

/**
 * Send Website Rejection Email
 */
export async function sendWebsiteRejectionEmail(
  userEmail: string,
  userName: string,
  websiteUrl: string,
  reason?: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Website Not Approved</h2>
      <p>Hi ${userName},</p>
      <p>We regret to inform you that your website <strong>${websiteUrl}</strong> has not been approved at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>You can submit another website or contact our support team if you have any questions.</p>
      <p><a href="${config.FRONTEND_URL}/dashboard/websites" style="background-color: #3F207F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Your Websites</a></p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Website Not Approved: ${websiteUrl}`,
    html,
  });
}

/**
 * Send Order Completed Email
 */
export async function sendOrderCompletedEmail(
  userEmail: string,
  userName: string,
  orderTitle: string,
  orderId: string,
  earnings: number
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2EE6B7;">Order Completed!</h2>
      <p>Hi ${userName},</p>
      <p>Great news! Your order has been completed and approved.</p>
      <p><strong>Order:</strong> ${orderTitle}</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Earnings:</strong> $${earnings.toFixed(2)}</p>
      <p>The payment will be processed according to your payment schedule.</p>
      <p><a href="${config.FRONTEND_URL}/dashboard/orders/${orderId}" style="background-color: #3F207F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Order Completed: ${orderTitle}`,
    html,
  });
}

/**
 * Send Order Revision Requested Email
 */
export async function sendOrderRevisionRequestedEmail(
  userEmail: string,
  userName: string,
  orderTitle: string,
  orderId: string,
  revisionNotes: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff8a3c;">Revision Requested</h2>
      <p>Hi ${userName},</p>
      <p>A revision has been requested for your order:</p>
      <p><strong>Order:</strong> ${orderTitle}</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Revision Notes:</strong></p>
      <p style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 10px 0;">${revisionNotes}</p>
      <p>Please review the notes and submit a revised version.</p>
      <p><a href="${config.FRONTEND_URL}/dashboard/orders/${orderId}" style="background-color: #3F207F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Revision Requested: ${orderTitle}`,
    html,
  });
}

/**
 * Send Order Cancelled Email
 */
export async function sendOrderCancelledEmail(
  userEmail: string,
  userName: string,
  orderTitle: string,
  orderId: string,
  reason?: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Order Cancelled</h2>
      <p>Hi ${userName},</p>
      <p>We regret to inform you that your order has been cancelled.</p>
      <p><strong>Order:</strong> ${orderTitle}</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you have any questions, please contact our support team.</p>
      <p><a href="${config.FRONTEND_URL}/dashboard/orders" style="background-color: #3F207F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Orders</a></p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Order Cancelled: ${orderTitle}`,
    html,
  });
}

/**
 * Send Counter Offer Accepted Email
 */
export async function sendCounterOfferAcceptedEmail(
  userEmail: string,
  userName: string,
  websiteUrl: string,
  price: number
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2EE6B7;">Counter Offer Accepted</h2>
      <p>Hi ${userName},</p>
      <p>Great news! Your counter offer has been accepted.</p>
      <p><strong>Website:</strong> ${websiteUrl}</p>
      <p><strong>Accepted Price:</strong> $${price.toFixed(2)}</p>
      <p>Your website is now active and ready to receive orders.</p>
      <p><a href="${config.FRONTEND_URL}/dashboard/websites" style="background-color: #3F207F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Website</a></p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Counter Offer Accepted: ${websiteUrl}`,
    html,
  });
}

/**
 * Send Counter Offer Rejected Email
 */
export async function sendCounterOfferRejectedEmail(
  userEmail: string,
  userName: string,
  websiteUrl: string,
  reason?: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Counter Offer Not Accepted</h2>
      <p>Hi ${userName},</p>
      <p>We regret to inform you that your counter offer for <strong>${websiteUrl}</strong> has not been accepted.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>You can submit a new counter offer or contact our support team if you have any questions.</p>
      <p><a href="${config.FRONTEND_URL}/dashboard/websites" style="background-color: #3F207F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Website</a></p>
      <p>Best regards,<br>The Publisher Authority Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Counter Offer Not Accepted: ${websiteUrl}`,
    html,
  });
}