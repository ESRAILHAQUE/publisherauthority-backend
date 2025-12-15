import { Router } from 'express';
import authRoutes from './auth/auth.routes';
import usersRoutes from './users/users.routes';
import websitesRoutes from './websites/websites.routes';
import ordersRoutes from './orders/orders.routes';
import paymentsRoutes from './payments/payments.routes';
import applicationsRoutes from './applications/applications.routes';
import blogRoutes from './blog/blog.routes';
import supportRoutes from './support/support.routes';
import dashboardRoutes from './dashboard/dashboard.routes';
import adminRoutes from './admin/admin.routes';
import publicSettingsRoutes from './settings/public.routes';

/**
 * Module Router
 * Aggregates all module routes
 */
const router = Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/applications', applicationsRoutes);
router.use('/blog', blogRoutes);
router.use('/settings', publicSettingsRoutes);

// Protected routes (Publisher)
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/websites', websitesRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/support', supportRoutes);

// Admin routes
router.use('/admin', adminRoutes);

export default router;

