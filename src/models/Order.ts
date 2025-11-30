import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  websiteId: mongoose.Types.ObjectId;
  articleTitle: string;
  articleContent: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
    },
    articleTitle: {
      type: String,
      required: [true, 'Article title is required'],
    },
    articleContent: {
      type: String,
      required: [true, 'Article content is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IOrder>('Order', orderSchema);

