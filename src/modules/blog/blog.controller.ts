import { Request, Response, NextFunction } from 'express';
import blogService from './blog.service';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';

/**
 * Blog Controller
 */
class BlogController {
  /**
   * @route   GET /api/v1/blog/posts
   * @desc    Get all blog posts (public)
   * @access  Public
   */
  getAllPosts = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { category, page = 1, limit = 20 } = req.query;

    const filters: any = {};
    if (category) filters.category = category;

    const result = await blogService.getAllPosts(filters, Number(page), Number(limit));

    sendSuccess(res, 200, 'Blog posts retrieved successfully', result);
  });

  /**
   * @route   GET /api/v1/blog/posts/:slug
   * @desc    Get blog post by slug
   * @access  Public
   */
  getPostBySlug = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;

    const post = await blogService.getPostBySlug(slug);

    sendSuccess(res, 200, 'Blog post retrieved successfully', { post });
  });

  /**
   * @route   GET /api/v1/blog/categories
   * @desc    Get all categories
   * @access  Public
   */
  getAllCategories = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const categories = await blogService.getAllCategories();

    sendSuccess(res, 200, 'Categories retrieved successfully', {
      count: categories.length,
      categories,
    });
  });
}

export default new BlogController();

