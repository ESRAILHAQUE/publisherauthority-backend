import mongoose, { Document, Schema } from 'mongoose';

/**
 * Category Interface
 */
export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Blog Post Interface
 */
export interface IBlogPost extends Document {
  title: string;
  slug: string;
  featuredImage?: string;
  content: string;
  excerpt?: string;
  category: mongoose.Types.ObjectId;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  author: mongoose.Types.ObjectId;
  status: 'draft' | 'published';
  publishedAt?: Date;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Category Schema
 */
const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Blog Post Schema
 */
const blogPostSchema = new Schema<IBlogPost>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    featuredImage: {
      type: String,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    tags: {
      type: [String],
      default: [],
    },
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published'],
        message: 'Invalid status',
      },
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-set publishedAt when status changes to published
blogPostSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Indexes
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1 });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
export const BlogPost = mongoose.model<IBlogPost>('BlogPost', blogPostSchema);

