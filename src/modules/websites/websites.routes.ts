import { Router } from 'express';
import websitesController from './websites.controller';
import { protect } from '../../middleware/auth';

/**
 * Websites Routes
 */
const router = Router();

// All routes require authentication
router.use(protect);

// Publisher routes
router.post('/', websitesController.addWebsite);
router.post('/bulk', websitesController.bulkAddWebsites);
router.get('/', websitesController.getUserWebsites);
// Verification routes - must come before /:id route
router.post('/:id/verify/tag', websitesController.submitTagVerification);
router.post('/:id/verify/article', websitesController.submitArticleVerification);
router.post('/:id/counter-offer', websitesController.sendCounterOffer);
router.post('/:id/counter-offer/respond', websitesController.respondToCounterOffer);
router.get('/:id', websitesController.getWebsiteById);
router.put('/:id', websitesController.updateWebsite);
router.delete('/:id', websitesController.deleteWebsite);

export default router;



