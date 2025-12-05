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
  price: number;
  status: 'pending' | 'counter-offer' | 'active' | 'rejected' | 'deleted';
  verificationMethod?: 'tag' | 'article';
  verificationCode?: string;
  verificationArticleUrl?: string;
  verifiedAt?: Date;
  counterOffer?: {
    price: number;
    notes?: string;
    terms?: string;
    offeredBy: 'admin' | 'user';
    offeredAt: Date;
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
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
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
      price: {
        type: Number,
        min: [0, 'Counter offer price cannot be negative'],
      },
      notes: String,
      terms: String,
      offeredBy: {
        type: String,
        enum: ['admin', 'user'],
      },
      offeredAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
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

// Validate counterOffer when it is being set or modified
websiteSchema.pre('save', function(next) {
  // Only validate if counterOffer is being modified and has data
  if (this.isModified('counterOffer') && this.counterOffer) {
    const co = this.counterOffer as any;
    // If counterOffer is being set, it must have required fields
    if (co.price === undefined || co.price === null || co.price <= 0) {
      return next(new Error('Counter offer price is required and must be greater than 0'));
    }
    if (!co.offeredBy || !['admin', 'user'].includes(co.offeredBy)) {
      return next(new Error('Counter offer offeredBy is required and must be "admin" or "user"'));
    }
  }
  next();
});

// Indexes for better query performance
websiteSchema.index({ userId: 1, status: 1 });
websiteSchema.index({ url: 1 });

const Website = mongoose.model<IWebsite>('Website', websiteSchema);
export default Website;



