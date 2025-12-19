import { Router } from 'express';
import adminController from './admin.controller';
import settingsRoutes from '../settings/settings.routes';
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
router.post('/publishers', adminController.createPublisher);
router.put('/publishers/:id/level', adminController.updatePublisherLevel);
router.put('/publishers/:id/status', adminController.updatePublisherStatus);

// Websites Management
router.get('/websites', adminController.getAllWebsites);
router.get('/websites/:id', adminController.getWebsiteById);
router.put('/websites/:id/verify', adminController.verifyWebsite);
router.post('/websites/:id/counter-offer', adminController.sendCounterOffer);
router.post('/websites/:id/counter-offer/accept', adminController.acceptUserCounterOffer);
router.put('/websites/:id/status', adminController.updateWebsiteStatus);

// Orders Management
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderById);
router.post('/orders', adminController.createOrder);
router.put('/orders/:id', adminController.updateOrder);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// Payments Management
router.get('/payments', adminController.getAllPayments);
router.get('/payments/user/:userId', adminController.getUserPayments);
router.get('/payments/user/:userId/stats', adminController.getUserPaymentStats);
router.post('/payments/generate', adminController.generateInvoice);
router.put('/payments/:id/process', adminController.processPayment);
router.put('/payments/:id/mark-paid', adminController.markPaymentAsPaid);
router.post('/payments/:id/manual-pay', adminController.manualPay);
router.post('/payments/manual/create-and-pay', adminController.manualPayCreate);

// Applications Management
router.get('/applications', adminController.getAllApplications);
router.get('/applications/:id', adminController.getApplicationById);
router.post('/applications/:id/approve', adminController.approveApplication);
router.post('/applications/:id/reject', adminController.rejectApplication);

// Support Tickets Management
router.get('/support/tickets', adminController.getAllTickets);
router.get('/support/tickets/:id', adminController.getTicketById);
router.post('/support/tickets/:id/assign', adminController.assignTicket);
router.put('/support/tickets/:id/status', adminController.updateTicketStatus);
router.post('/support/tickets/:id/messages', adminController.addTicketMessage);

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

// Settings Management
router.use('/settings', settingsRoutes);

export default router;



