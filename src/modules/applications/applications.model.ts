import mongoose, { Document, Schema } from 'mongoose';

/**
 * Application Interface
 */
export interface IApplication extends Document {
  userId?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  country: string;
  hearAboutUs?: string;
  guestPostExperience?: string;
  guestPostUrls: string[];
  referralInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  csvData?: any[];
  quizAnswers: {
    question1?: string;
    question2?: string;
    question3?: string;
    question4?: string;
    question5?: string;
    question6?: string;
    question7?: string;
    question8?: string;
    question9?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Application Schema
 */
const applicationSchema = new Schema<IApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
    },
    hearAboutUs: {
      type: String,
    },
    guestPostExperience: {
      type: String,
    },
    guestPostUrls: {
      type: [String],
      validate: {
        validator: function(v: string[]) {
          return v.length >= 3;
        },
        message: 'At least 3 guest post URLs are required',
      },
    },
    referralInfo: {
      name: String,
      email: String,
      phone: String,
    },
    csvData: {
      type: Schema.Types.Mixed,
    },
    quizAnswers: {
      question1: String,
      question2: String,
      question3: String,
      question4: String,
      question5: String,
      question6: String,
      question7: String,
      question8: String,
      question9: String,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Invalid application status',
      },
      default: 'pending',
      index: true,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Application = mongoose.model<IApplication>('Application', applicationSchema);
export default Application;

