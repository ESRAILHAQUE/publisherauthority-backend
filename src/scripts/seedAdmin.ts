import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../modules/auth/auth.model';
import config from '../config/env';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Seed Default Admin User
 * Run this script to create a default admin user in the database
 */

const defaultAdmin = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@publisherauthority.com',
  password: 'Admin123@123',
  country: 'US',
  role: 'admin',
  accountLevel: 'premium',
  accountStatus: 'active',
  applicationStatus: 'approved',
  isVerified: true,
  isActive: true,
};

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: defaultAdmin.email });
    if (existingAdmin) {
      logger.info(`Admin user already exists: ${defaultAdmin.email}`);
      logger.info('To reset admin password, delete the user first or update manually.');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create(defaultAdmin);
    logger.info(`✓ Default admin user created successfully!`);
    logger.info(`Email: ${admin.email}`);
    logger.info(`Password: ${defaultAdmin.password}`);
    logger.info(`Role: ${admin.role}`);
    logger.info(`\n⚠️  IMPORTANT: Change the default password after first login!`);

    process.exit(0);
  } catch (error: any) {
    logger.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAdmin();

