import { Router } from 'express';
import adminController from './admin.controller';
import { protect, restrictTo } from '../../middleware/auth';

/**
 * Admin Routes
 * All admin-only routes
 */
const router = Router();

// All routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);
router.get('/activity', adminController.getRecentActivity);

// Publishers Management
router.get('/publishers', adminController.getAllPublishers);
router.get('/publishers/:id', adminController.getPublisherDetails);
router.put('/publishers/:id/level', adminController.updatePublisherLevel);
router.put('/publishers/:id/status', adminController.updatePublisherStatus);

// Websites Management
router.get('/websites', adminController.getAllWebsites);
router.put('/websites/:id/verify', adminController.verifyWebsite);
router.post('/websites/:id/counter-offer', adminController.sendCounterOffer);
router.put('/websites/:id/status', adminController.updateWebsiteStatus);

// Orders Management
router.get('/orders', adminController.getAllOrders);
router.post('/orders', adminController.createOrder);
router.put('/orders/:id', adminController.updateOrder);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// Payments Management
router.get('/payments', adminController.getAllPayments);
router.post('/payments/generate', adminController.generateInvoice);
router.put('/payments/:id/process', adminController.processPayment);
router.put('/payments/:id/mark-paid', adminController.markPaymentAsPaid);

// Applications Management
router.get('/applications', adminController.getAllApplications);
router.get('/applications/:id', adminController.getApplicationById);
router.post('/applications/:id/approve', adminController.approveApplication);
router.post('/applications/:id/reject', adminController.rejectApplication);

// Support Tickets Management
router.get('/support/tickets', adminController.getAllTickets);
router.post('/support/tickets/:id/assign', adminController.assignTicket);
router.put('/support/tickets/:id/status', adminController.updateTicketStatus);

// Blog Management
router.get('/blog/posts', adminController.getAllBlogPosts);
router.post('/blog/posts', adminController.createBlogPost);
router.get('/blog/posts/:id', adminController.getBlogPostById);
router.put('/blog/posts/:id', adminController.updateBlogPost);
router.delete('/blog/posts/:id', adminController.deleteBlogPost);

// Category Management
router.post('/blog/categories', adminController.createCategory);
router.put('/blog/categories/:id', adminController.updateCategory);
router.delete('/blog/categories/:id', adminController.deleteCategory);

export default router;

