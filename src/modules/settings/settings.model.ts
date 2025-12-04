import mongoose, { Document, Schema } from 'mongoose';

/**
 * Settings Interface
 */
export interface ISettings extends Document {
  platformName: string;
  adminEmail: string;
  supportEmail: string;
  paymentSchedule: string;
  minimumPayout: number;
  updatedAt: Date;
}

/**
 * Settings Schema
 */
const settingsSchema = new Schema<ISettings>(
  {
    platformName: {
      type: String,
      default: 'Publisher Authority',
    },
    adminEmail: {
      type: String,
      default: 'admin@publisherauthority.com',
    },
    supportEmail: {
      type: String,
      default: 'Info@publisherauthority.com',
    },
    paymentSchedule: {
      type: String,
      default: '1st and 15th of each month',
    },
    minimumPayout: {
      type: Number,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);


const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
export default Settings;

