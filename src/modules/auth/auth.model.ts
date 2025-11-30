import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Interface
 * Defines the structure of User document
 */
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  country: string;
  profileImage?: string;
  accountLevel: 'silver' | 'gold' | 'premium';
  accountStatus: 'active' | 'suspended' | 'deleted';
  role: 'publisher' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  paypalEmail?: string;
  applicationStatus: 'pending' | 'approved' | 'rejected';
  totalEarnings: number;
  completedOrders: number;
  activeWebsites: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User Schema
 * Mongoose schema for User collection
 */
const userSchema = new Schema<IUser>(
  {
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
      immutable: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
    },
    profileImage: {
      type: String,
    },
    accountLevel: {
      type: String,
      enum: {
        values: ['silver', 'gold', 'premium'],
        message: 'Invalid account level',
      },
      default: 'silver',
    },
    accountStatus: {
      type: String,
      enum: {
        values: ['active', 'suspended', 'deleted'],
        message: 'Invalid account status',
      },
      default: 'active',
    },
    role: {
      type: String,
      enum: {
        values: ['publisher', 'admin'],
        message: 'Role must be either publisher or admin',
      },
      default: 'publisher',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    paypalEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    applicationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeWebsites: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete (ret as any).password;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

/**
 * Pre-save Middleware
 * Hash password before saving to database
 */
userSchema.pre('save', async function (next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Instance Method
 * Compare provided password with hashed password in database
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create and export User model
const User = mongoose.model<IUser>('User', userSchema);
export default User;

