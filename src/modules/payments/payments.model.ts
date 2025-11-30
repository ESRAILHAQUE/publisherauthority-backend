import mongoose, { Document, Schema } from 'mongoose';

/**
 * Payment/Invoice Interface
 */
export interface IPayment extends Document {
  invoiceNumber: string;
  userId: mongoose.Types.ObjectId;
  orderIds: mongoose.Types.ObjectId[];
  amount: number;
  currency: string;
  paymentMethod: string;
  paypalEmail?: string;
  invoiceDate: Date;
  dueDate: Date;
  paymentDate?: Date;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  description?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment Schema
 */
const paymentSchema = new Schema<IPayment>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    orderIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Order',
    }],
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      default: 'PayPal',
    },
    paypalEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    paymentDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'paid', 'failed'],
        message: 'Invalid payment status',
      },
      default: 'pending',
      index: true,
    },
    description: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate invoice number
paymentSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Payment').countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    this.invoiceNumber = `INV-${year}${month}-${count + 1}`;
  }
  next();
});

// Indexes
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ invoiceNumber: 1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;

