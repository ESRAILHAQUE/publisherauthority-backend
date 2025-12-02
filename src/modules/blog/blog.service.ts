import { BlogPost, Category, IBlogPost, ICategory } from './blog.model';
import AppError from '../../utils/AppError';
import logger from '../../utils/logger';

/**
 * Blog Service
 */
class BlogService {
  /**
   * Create Blog Post (Admin)
   */
  async createPost(postData: Partial<IBlogPost>): Promise<IBlogPost> {
    const post = await BlogPost.create(postData);

    logger.info(`Blog post created: ${post.title}`);
    return post;
  }

  /**
   * Get All Posts (Public/Admin)
   */
  async getAllPosts(
    filters: any = {},
    page = 1,
    limit = 20
  ): Promise<{
    posts: IBlogPost[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    // For public, only show published posts
    if (!filters.admin) {
      filters.status = 'published';
    }
    delete filters.admin;

    const posts = await BlogPost.find(filters)
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BlogPost.countDocuments(filters);

    return {
      posts,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Post by Slug
   */
  async getPostBySlug(slug: string): Promise<IBlogPost> {
    const post = await BlogPost.findOne({ slug, status: 'published' })
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName');

    if (!post) {
      throw new AppError('Blog post not found', 404);
    }

    // Increment views
    post.views += 1;
    await post.save();

    return post;
  }

  /**
   * Get Post by ID (Admin)
   */
  async getPostById(postId: string): Promise<IBlogPost> {
    const post = await BlogPost.findById(postId)
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName');

    if (!post) {
      throw new AppError('Blog post not found', 404);
    }

    return post;
  }

  /**
   * Update Post (Admin)
   */
  async updatePost(postId: string, updateData: Partial<IBlogPost>): Promise<IBlogPost> {
    const post = await BlogPost.findByIdAndUpdate(
      postId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!post) {
      throw new AppError('Blog post not found', 404);
    }

    logger.info(`Blog post updated: ${post.title}`);
    return post;
  }

  /**
   * Delete Post (Admin)
   */
  async deletePost(postId: string): Promise<void> {
    const post = await BlogPost.findByIdAndDelete(postId);

    if (!post) {
      throw new AppError('Blog post not found', 404);
    }

    logger.info(`Blog post deleted: ${post.title}`);
  }

  /**
   * Create Category (Admin)
   */
  async createCategory(categoryData: Partial<ICategory>): Promise<ICategory> {
    const category = await Category.create(categoryData);

    logger.info(`Category created: ${category.name}`);
    return category;
  }

  /**
   * Get All Categories
   */
  async getAllCategories(): Promise<ICategory[]> {
    const categories = await Category.find().sort({ name: 1 });
    return categories;
  }

  /**
   * Update Category (Admin)
   */
  async updateCategory(categoryId: string, updateData: Partial<ICategory>): Promise<ICategory> {
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    logger.info(`Category updated: ${category.name}`);
    return category;
  }

  /**
   * Delete Category (Admin)
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const category = await Category.findByIdAndDelete(categoryId);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    logger.info(`Category deleted: ${category.name}`);
  }
}

export default new BlogService();



