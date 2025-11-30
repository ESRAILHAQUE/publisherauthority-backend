import { Router } from 'express';
import supportController from './support.controller';
import { protect } from '../../middleware/auth';

/**
 * Support Routes
 */
const router = Router();

// All routes require authentication
router.use(protect);

// User routes
router.post('/tickets', supportController.createTicket);
router.get('/tickets', supportController.getUserTickets);
router.get('/tickets/:id', supportController.getTicketById);
router.post('/tickets/:id/messages', supportController.addMessage);

export default router;

