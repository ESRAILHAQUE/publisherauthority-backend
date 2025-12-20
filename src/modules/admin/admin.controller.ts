import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import adminService from "./admin.service";
import websitesService from "../websites/websites.service";
import ordersService from "../orders/orders.service";
import paymentsService from "../payments/payments.service";
import applicationsService from "../applications/applications.service";
import supportService from "../support/support.service";
import blogService from "../blog/blog.service";
import asyncHandler from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import AppError from "../../utils/AppError";

/**
 * Admin Controller
 * Handles all admin operations
 */
class AdminController {
  /**
   * @route   GET /api/v1/admin/dashboard
   * @desc    Get admin dashboard statistics
   * @access  Private/Admin
   */
  getDashboardStats = asyncHandler(
    async (_req: AuthRequest, res: Response, _next: NextFunction) => {
      const stats = await adminService.getDashboardStats();

      sendSuccess(
        res,
        200,
        "Dashboard statistics retrieved successfully",
        stats
      );
    }
  );

  /**
   * @route   GET /api/v1/admin/publishers
   * @desc    Get all publishers
   * @access  Private/Admin
   */
  getAllPublishers = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { accountLevel, accountStatus, page = 1, limit = 25 } = req.query;

      const filters: any = {};
      if (accountLevel) filters.accountLevel = accountLevel;
      if (accountStatus) filters.accountStatus = accountStatus;

      const result = await adminService.getAllPublishers(
        filters,
        Number(page),
        Number(limit)
      );

      sendSuccess(res, 200, "Publishers retrieved successfully", result);
    }
  );

  /**
   * @route   POST /api/v1/admin/publishers
   * @desc    Create publisher manually (without application)
   * @access  Private/Admin
   */
  createPublisher = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const {
        firstName,
        lastName,
        email,
        country,
        paypalEmail,
        password,
      } = req.body;

      const trimmedPassword = String(password || "").trim();

      if (!firstName || !lastName || !email || !country || !password) {
        throw new AppError(
          "firstName, lastName, email, country, and password are required",
          400
        );
      }
      if (trimmedPassword.length < 6) {
        throw new AppError("Password must be at least 6 characters", 400);
      }

      const result = await adminService.createPublisher({
        firstName,
        lastName,
        email,
        country,
        paypalEmail,
        password: trimmedPassword,
      });

      sendSuccess(res, 201, "Publisher created successfully", result);
    }
  );

  /**
   * @route   GET /api/v1/admin/publishers/:id
   * @desc    Get publisher details
   * @access  Private/Admin
   */
  getPublisherDetails = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const details = await adminService.getPublisherDetails(id);

      sendSuccess(
        res,
        200,
        "Publisher details retrieved successfully",
        details
      );
    }
  );

  /**
   * @route   PUT /api/v1/admin/publishers/:id/level
   * @desc    Update publisher account level
   * @access  Private/Admin
   */
  updatePublisherLevel = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;
      const { accountLevel } = req.body;

      const publisher = await adminService.updatePublisherLevel(
        id,
        accountLevel
      );

      sendSuccess(res, 200, "Publisher level updated successfully", {
        publisher,
      });
    }
  );

  /**
   * @route   PUT /api/v1/admin/publishers/:id/status
   * @desc    Update publisher status
   * @access  Private/Admin
   */
  updatePublisherStatus = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;
      const { accountStatus } = req.body;

      const publisher = await adminService.updatePublisherStatus(
        id,
        accountStatus
      );

      sendSuccess(res, 200, "Publisher status updated successfully", {
        publisher,
      });
    }
  );

  /**
   * @route   GET /api/v1/admin/websites
   * @desc    Get all websites
   * @access  Private/Admin
   */
  getAllWebsites = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { status, page = 1, limit = 25, minDa, maxDa, minTraffic, maxTraffic, minPrice, maxPrice, niche, verified, search } = req.query;

      const filters: any = {};
      if (status) {
        // Normalize "approved" to active for backward compatibility
        filters.status = status === "approved" ? "active" : status;
      }
      if (search) filters.search = search;
      if (minDa) filters.minDa = Number(minDa);
      if (maxDa) filters.maxDa = Number(maxDa);
      if (minTraffic) filters.minTraffic = Number(minTraffic);
      if (maxTraffic) filters.maxTraffic = Number(maxTraffic);
      if (minPrice) filters.minPrice = Number(minPrice);
      if (maxPrice) filters.maxPrice = Number(maxPrice);
      if (niche) filters.niche = niche;
      if (verified !== undefined) filters.verified = verified;

      const result = await websitesService.getAllWebsites(
        filters,
        Number(page),
        Number(limit)
      );

      sendSuccess(res, 200, "Websites retrieved successfully", result);
    }
  );

  /**
   * @route   GET /api/v1/admin/websites/:id
   * @desc    Get single website details (admin)
   * @access  Private/Admin
   */
  getWebsiteById = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const website = await adminService.getWebsiteById(id);

      sendSuccess(res, 200, "Website retrieved successfully", { website });
    }
  );

  /**
   * @route   PUT /api/v1/admin/websites/:id/verify
   * @desc    Verify website
   * @access  Private/Admin
   */
  verifyWebsite = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;
      const { method } = req.body;

      const website = await websitesService.verifyWebsite(id, method);

      sendSuccess(res, 200, "Website verified successfully", { website });
    }
  );

  /**
   * @route   POST /api/v1/admin/websites/:id/counter-offer
   * @desc    Send counter offer
   * @access  Private/Admin
   */
  sendCounterOffer = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;
      const { price, notes, terms } = req.body;

      if (!price || price <= 0) {
        res.status(400).json({
          success: false,
          message: "Price is required and must be greater than 0",
        });
        return;
      }

      const website = await websitesService.sendCounterOffer(id, {
        price,
        notes,
        terms,
      });

      sendSuccess(res, 200, "Counter offer sent successfully", { website });
    }
  );

  /**
   * @route   POST /api/v1/admin/websites/:id/counter-offer/accept
   * @desc    Accept user counter offer
   * @access  Private/Admin
   */
  acceptUserCounterOffer = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const website = await websitesService.acceptUserCounterOffer(id);

      sendSuccess(res, 200, "User counter offer accepted successfully", {
        website,
      });
    }
  );

  /**
   * @route   PUT /api/v1/admin/websites/:id/status
   * @desc    Update website status
   * @access  Private/Admin
   */
  updateWebsiteStatus = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;

      const website = await websitesService.updateWebsiteStatus(
        id,
        status,
        rejectionReason
      );

      sendSuccess(res, 200, "Website status updated successfully", { website });
    }
  );

  /**
   * @route   GET /api/v1/admin/orders
   * @desc    Get all orders
   * @access  Private/Admin
   */
  getAllOrders = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { status, publisherId, page = 1, limit = 20 } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (publisherId) filters.publisherId = publisherId;

      const result = await ordersService.getAllOrders(
        filters,
        Number(page),
        Number(limit)
      );

      sendSuccess(res, 200, "Orders retrieved successfully", result);
    }
  );

  /**
   * @route   POST /api/v1/admin/orders
   * @desc    Create order
   * @access  Private/Admin
   */
  createOrder = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const order = await ordersService.createOrder(req.body);

      sendSuccess(res, 201, "Order created successfully", { order });
    }
  );

  /**
   * @route   GET /api/v1/admin/orders/:id
   * @desc    Get order by ID
   * @access  Private/Admin
   */
  getOrderById = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      // Admin can access any order without publisherId check
      const order = await ordersService.getOrderById(id);

      sendSuccess(res, 200, "Order retrieved successfully", { order });
    }
  );

  /**
   * @route   PUT /api/v1/admin/orders/:id
   * @desc    Update order
   * @access  Private/Admin
   */
  updateOrder = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const order = await ordersService.updateOrder(id, req.body);

      sendSuccess(res, 200, "Order updated successfully", { order });
    }
  );

  /**
   * @route   PUT /api/v1/admin/orders/:id/status
   * @desc    Update order status
   * @access  Private/Admin
   */
  updateOrderStatus = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;
      const { status, notes } = req.body;

      const order = await ordersService.updateOrderStatus(id, status, notes);

      sendSuccess(res, 200, "Order status updated successfully", { order });
    }
  );

  /**
   * @route   GET /api/v1/admin/payments
   * @desc    Get all payments
   * @access  Private/Admin
   */
  getAllPayments = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { status, page = 1, limit = 20 } = req.query;

      const filters: any = {};
      if (status) filters.status = status;

      const result = await paymentsService.getAllPayments(
        filters,
        Number(page),
        Number(limit)
      );

      sendSuccess(res, 200, "Payments retrieved successfully", result);
    }
  );

  /**
   * @route   GET /api/v1/admin/payments/user/:userId
   * @desc    Get payments for a specific user
   * @access  Private/Admin
   */
  getUserPayments = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { userId } = req.params;
      const { status, page = 1, limit = 20 } = req.query;

      const filters: any = {};
      if (status) filters.status = status;

      const result = await paymentsService.getUserPayments(
        userId,
        filters,
        Number(page),
        Number(limit)
      );

      sendSuccess(res, 200, "User payments retrieved successfully", result);
    }
  );

  /**
   * @route   GET /api/v1/admin/payments/user/:userId/stats
   * @desc    Get payment statistics for a specific user
   * @access  Private/Admin
   */
  getUserPaymentStats = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { userId } = req.params;

      const stats = await paymentsService.getPaymentStats(userId);

      sendSuccess(res, 200, "User payment statistics retrieved successfully", stats);
    }
  );

  /**
   * @route   POST /api/v1/admin/payments/generate
   * @desc    Generate invoice
   * @access  Private/Admin
   */
  generateInvoice = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { userId, orderIds } = req.body;

      const payment = await paymentsService.generateInvoice(userId, orderIds);

      sendSuccess(res, 201, "Invoice generated successfully", { payment });
    }
  );

  /**
   * @route   PUT /api/v1/admin/payments/:id/process
   * @desc    Process payment
   * @access  Private/Admin
   */
  processPayment = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const payment = await paymentsService.processPayment(id);

      sendSuccess(res, 200, "Payment processing initiated", { payment });
    }
  );

  /**
   * @route   PUT /api/v1/admin/payments/:id/mark-paid
   * @desc    Mark payment as paid
   * @access  Private/Admin
   */
  markPaymentAsPaid = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const payment = await paymentsService.markAsPaid(id);

      sendSuccess(res, 200, "Payment marked as paid", { payment });
    }
  );

  /**
   * @route   GET /api/v1/admin/applications
   * @desc    Get all applications
   * @access  Private/Admin
   */
  getAllApplications = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { status, page = 1, limit = 20 } = req.query;

      const filters: any = {};
      if (status) filters.status = status;

      const result = await applicationsService.getAllApplications(
        filters,
        Number(page),
        Number(limit)
      );

      sendSuccess(res, 200, "Applications retrieved successfully", result);
    }
  );

  /**
   * @route   GET /api/v1/admin/applications/:id
   * @desc    Get application details
   * @access  Private/Admin
   */
  getApplicationById = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const application = await applicationsService.getApplicationById(id);

      sendSuccess(res, 200, "Application retrieved successfully", {
        application,
      });
    }
  );

  /**
   * @route   POST /api/v1/admin/applications/:id/approve
   * @desc    Approve application
   * @access  Private/Admin
   */
  approveApplication = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;
      const reviewedBy = req.user!.id;

      const result = await applicationsService.approveApplication(
        id,
        reviewedBy
      );

      sendSuccess(
        res,
        200,
        "Application approved and user account created",
        result
      );
    }
  );

  /**
   * @route   POST /api/v1/admin/applications/:id/reject
   * @desc    Reject application
   * @access  Private/Admin
   */
  rejectApplication = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;
      const reviewedBy = req.user!.id;
      const { rejectionReason } = req.body;

      const application = await applicationsService.rejectApplication(
        id,
        reviewedBy,
        rejectionReason
      );

      sendSuccess(res, 200, "Application rejected", { application });
    }
  );

  /**
   * @route   GET /api/v1/admin/support/tickets
   * @desc    Get all support tickets
   * @access  Private/Admin
   */
  getAllTickets = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { status, priority, page = 1, limit = 20 } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (priority) filters.priority = priority;

      const result = await supportService.getAllTickets(
        filters,
        Number(page),
        Number(limit)
      );

      sendSuccess(res, 200, "Support tickets retrieved successfully", result);
    }
  );

  /**
   * @route   POST /api/v1/admin/support/tickets/:id/assign
   * @desc    Assign ticket to admin
   * @access  Private/Admin
   */
  assignTicket = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;
      const adminId = req.user!.id;

      const ticket = await supportService.assignTicket(id, adminId);

      sendSuccess(res, 200, "Ticket assigned successfully", { ticket });
    }
  );

  /**
   * @route   GET /api/v1/admin/support/tickets/:id
   * @desc    Get ticket by ID (Admin)
   * @access  Private/Admin
   */
  getTicketById = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      // Admin can access any ticket without userId restriction
      const ticket = await supportService.getTicketById(id);

      sendSuccess(res, 200, "Support ticket retrieved successfully", {
        ticket,
      });
    }
  );

  /**
   * @route   PUT /api/v1/admin/support/tickets/:id/status
   * @desc    Update ticket status
   * @access  Private/Admin
   */
  updateTicketStatus = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;
      const { status } = req.body;

      const ticket = await supportService.updateTicketStatus(id, status);

      sendSuccess(res, 200, "Ticket status updated successfully", { ticket });
    }
  );

  /**
   * @route   POST /api/v1/admin/payments/:id/manual-pay
   * @desc    Manually mark payment as paid (with optional amount override)
   * @access  Private/Admin
   */
  manualPay = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { amount } = req.body;

    const payment = await paymentsService.manualPay(id, amount);

    sendSuccess(res, 200, "Payment marked as paid", { payment });
  });

  /**
   * @route   POST /api/v1/admin/payments/manual/create-and-pay
   * @desc    Create a manual payment for a user and mark as paid immediately
   * @access  Private/Admin
   */
  manualPayCreate = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { userId, amount, paymentMethod, paypalEmail } = req.body;

    const payment = await paymentsService.manualPayCreate(
      userId,
      amount,
      paymentMethod,
      paypalEmail
    );

    sendSuccess(res, 200, "Manual payment created and marked as paid", { payment });
  });

  /**
   * @route   POST /api/v1/admin/support/tickets/:id/messages
   * @desc    Add admin message to ticket
   * @access  Private/Admin
   */
  addTicketMessage = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { message } = req.body;

      const ticket = await supportService.addMessage(id, adminId, message);

      sendSuccess(res, 200, "Message added successfully", { ticket });
    }
  );

  /**
   * @route   GET /api/v1/admin/blog/posts
   * @desc    Get all blog posts (including drafts)
   * @access  Private/Admin
   */
  getAllBlogPosts = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { status, category, page = 1, limit = 20 } = req.query;

      const filters: any = { admin: true };
      if (status) filters.status = status;
      if (category) filters.category = category;

      const result = await blogService.getAllPosts(
        filters,
        Number(page),
        Number(limit)
      );

      sendSuccess(res, 200, "Blog posts retrieved successfully", result);
    }
  );

  /**
   * @route   POST /api/v1/admin/blog/posts
   * @desc    Create blog post
   * @access  Private/Admin
   */
  createBlogPost = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const authorId = req.user!.id;
      const postData = { ...req.body, author: authorId };

      const post = await blogService.createPost(postData);

      sendSuccess(res, 201, "Blog post created successfully", { post });
    }
  );

  /**
   * @route   GET /api/v1/admin/blog/posts/:id
   * @desc    Get blog post by ID
   * @access  Private/Admin
   */
  getBlogPostById = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const post = await blogService.getPostById(id);

      sendSuccess(res, 200, "Blog post retrieved successfully", { post });
    }
  );

  /**
   * @route   PUT /api/v1/admin/blog/posts/:id
   * @desc    Update blog post
   * @access  Private/Admin
   */
  updateBlogPost = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const post = await blogService.updatePost(id, req.body);

      sendSuccess(res, 200, "Blog post updated successfully", { post });
    }
  );

  /**
   * @route   DELETE /api/v1/admin/blog/posts/:id
   * @desc    Delete blog post
   * @access  Private/Admin
   */
  deleteBlogPost = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      await blogService.deletePost(id);

      sendSuccess(res, 200, "Blog post deleted successfully", null);
    }
  );

  /**
   * @route   POST /api/v1/admin/blog/categories
   * @desc    Create category
   * @access  Private/Admin
   */
  createCategory = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const category = await blogService.createCategory(req.body);

      sendSuccess(res, 201, "Category created successfully", { category });
    }
  );

  /**
   * @route   PUT /api/v1/admin/blog/categories/:id
   * @desc    Update category
   * @access  Private/Admin
   */
  updateCategory = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      const category = await blogService.updateCategory(id, req.body);

      sendSuccess(res, 200, "Category updated successfully", { category });
    }
  );

  /**
   * @route   DELETE /api/v1/admin/blog/categories/:id
   * @desc    Delete category
   * @access  Private/Admin
   */
  deleteCategory = asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const { id } = req.params;

      await blogService.deleteCategory(id);

      sendSuccess(res, 200, "Category deleted successfully", null);
    }
  );

  /**
   * @route   GET /api/v1/admin/activity
   * @desc    Get recent activity
   * @access  Private/Admin
   */
  getRecentActivity = asyncHandler(
    async (_req: AuthRequest, res: Response, _next: NextFunction) => {
      const activity = await adminService.getRecentActivity();

      sendSuccess(res, 200, "Recent activity retrieved successfully", activity);
    }
  );
}

export default new AdminController();
