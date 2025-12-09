import mongoose, { Document, Schema } from "mongoose";

/**
 * Application Interface
 */
export interface IApplication extends Document {
  userId?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactNumber?: string;
  country: string;
  hearAboutUs?: string;
  guestPostExperience?: string;
  guestPostUrls: string[];
  websiteNiche?: string;
  completedProjectsUrls?: string[];
  referralInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  csvData?: any[];
  files?: Array<{
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
    uploadedAt: Date;
  }>;
  quizAnswers?: {
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
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpires?: Date;
  status: "email-verification-pending" | "pending" | "approved" | "rejected";
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
      ref: "User",
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
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
        validator: function (v: string[]) {
          // Filter out empty strings and null values
          const validUrls = (v || []).filter((url) => url && url.trim() !== "");
          return validUrls.length >= 3;
        },
        message: "At least 3 guest post URLs are required",
      },
    },
    websiteNiche: {
      type: String,
      trim: true,
    },
    completedProjectsUrls: {
      type: [String],
      validate: {
        validator: function (v: string[]) {
          // Filter out empty strings and null values
          const validUrls = (v || []).filter((url) => url && url.trim() !== "");
          return validUrls.length >= 3;
        },
        message: "At least 3 completed project URLs are required",
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
    files: [
      {
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        mimetype: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationTokenExpires: {
      type: Date,
      select: false,
    },
    status: {
      type: String,
      enum: {
        values: ["email-verification-pending", "pending", "approved", "rejected"],
        message: "Invalid application status",
      },
      default: "email-verification-pending",
      index: true,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

const Application = mongoose.model<IApplication>(
  "Application",
  applicationSchema
);
export default Application;
