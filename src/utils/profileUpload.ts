import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/env';

// Create profile images directory if it doesn't exist
const profileImagesDir = path.join(process.cwd(), 'uploads', 'profile-images');
if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir, { recursive: true });
}

/**
 * Configure multer storage for profile images
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, profileImagesDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-uuid-originalname
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

/**
 * File filter - only allow image types
 */
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed image types
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'image/webp',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPG, PNG, GIF, WEBP) are allowed.'));
  }
};

/**
 * Multer upload configuration for profile images
 */
export const profileImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max file size
  },
});

/**
 * Get profile image URL
 * Returns full URL that works in both development and production
 */
export const getProfileImageUrl = (filename: string): string => {
  // Ensure filename is valid
  if (!filename || filename.trim() === '') {
    throw new Error('Invalid filename provided');
  }
  
  // Use BACKEND_URL from config which handles both dev and production
  const baseUrl = config.BACKEND_URL;
  const url = `${baseUrl}/api/v1/users/profile/images/${filename}`;
  
  // Log for debugging
  console.log('Generated profile image URL:', url);
  console.log('URL length:', url.length);
  console.log('NODE_ENV:', config.NODE_ENV);
  console.log('BACKEND_URL:', config.BACKEND_URL);
  
  return url;
};

/**
 * Delete profile image from filesystem
 */
export const deleteProfileImage = (filename: string): void => {
  const filePath = path.join(profileImagesDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

