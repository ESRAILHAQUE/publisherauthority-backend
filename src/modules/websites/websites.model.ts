import mongoose, { Document, Schema } from 'mongoose';

/**
 * Website Interface
 */
export interface IWebsite extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  domainAuthority: number;
  monthlyTraffic: number;
  niche: string;
  description?: string;
  status: 'pending' | 'counter-offer' | 'active' | 'rejected' | 'deleted';
  verificationMethod?: 'tag' | 'article';
  verificationCode?: string;
  verificationArticleUrl?: string;
  verifiedAt?: Date;
  counterOffer?: {
    notes: string;
    terms: string;
    status: 'pending' | 'accepted' | 'rejected';
  };
  submittedAt: Date;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Website Schema
 */
const websiteSchema = new Schema<IWebsite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Website URL is required'],
      trim: true,
      lowercase: true,
    },
    domainAuthority: {
      type: Number,
      required: [true, 'Domain Authority is required'],
      min: [0, 'DA must be at least 0'],
      max: [100, 'DA cannot exceed 100'],
    },
    monthlyTraffic: {
      type: Number,
      required: [true, 'Monthly traffic is required'],
      min: [0, 'Traffic cannot be negative'],
    },
    niche: {
      type: String,
      required: [true, 'Niche/category is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'counter-offer', 'active', 'rejected', 'deleted'],
        message: 'Invalid status',
      },
      default: 'pending',
      index: true,
    },
    verificationMethod: {
      type: String,
      enum: ['tag', 'article'],
    },
    verificationCode: {
      type: String,
    },
    verificationArticleUrl: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
    counterOffer: {
      notes: String,
      terms: String,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
      },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },
    rejectedReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
websiteSchema.index({ userId: 1, status: 1 });
websiteSchema.index({ url: 1 });

const Website = mongoose.model<IWebsite>('Website', websiteSchema);
export default Website;



