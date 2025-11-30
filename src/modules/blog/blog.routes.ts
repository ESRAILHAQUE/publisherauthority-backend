import { Router } from 'express';
import blogController from './blog.controller';

/**
 * Blog Routes (Public)
 */
const router = Router();

// Public routes
router.get('/posts', blogController.getAllPosts);
router.get('/posts/:slug', blogController.getPostBySlug);
router.get('/categories', blogController.getAllCategories);

export default router;

