import mongoose, { Document, Schema } from 'mongoose';

/**
 * Order Interface
 */
export interface IOrder extends Document {
  orderId: string;
  publisherId: mongoose.Types.ObjectId;
  websiteId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  targetUrl: string;
  keywords: string[];
  anchorText: string;
  linkRequirements?: object;
  status: 'pending' | 'ready-to-post' | 'verifying' | 'completed' | 'revision-requested' | 'cancelled';
  assignedAt: Date;
  deadline: Date;
  submittedAt?: Date;
  submittedUrl?: string;
  earnings: number;
  verificationNotes?: string;
  revisionNotes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order Schema
 */
const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    publisherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Publisher ID is required'],
      index: true,
    },
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: 'Website',
      required: [true, 'Website ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Order title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    targetUrl: {
      type: String,
      required: [true, 'Target URL is required'],
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    anchorText: {
      type: String,
      required: [true, 'Anchor text is required'],
      trim: true,
    },
    linkRequirements: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'ready-to-post', 'verifying', 'completed', 'revision-requested', 'cancelled'],
        message: 'Invalid order status',
      },
      default: 'pending',
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    submittedAt: {
      type: Date,
    },
    submittedUrl: {
      type: String,
      trim: true,
    },
    earnings: {
      type: Number,
      required: [true, 'Earnings amount is required'],
      min: [0, 'Earnings cannot be negative'],
    },
    verificationNotes: {
      type: String,
    },
    revisionNotes: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate orderId
orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ORD-${Date.now()}-${count + 1}`;
  }
  next();
});

// Indexes
orderSchema.index({ publisherId: 1, status: 1 });
orderSchema.index({ websiteId: 1 });
orderSchema.index({ orderId: 1 });

const Order = mongoose.model<IOrder>('Order', orderSchema);
export default Order;



