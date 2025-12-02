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
      logger.warn("Email configuration is incomplete. Skipping email send.");
      return;
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
