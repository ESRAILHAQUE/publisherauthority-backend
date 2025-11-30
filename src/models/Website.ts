import mongoose, { Document, Schema } from 'mongoose';

export interface IWebsite extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  domain: string;
  category: string;
  monthlyTraffic: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const websiteSchema = new Schema<IWebsite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    url: {
      type: String,
      required: [true, 'Website URL is required'],
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    monthlyTraffic: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWebsite>('Website', websiteSchema);

