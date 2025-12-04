import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Environment Configuration Interface
 */
interface Config {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_USER: string;
  EMAIL_PASSWORD: string;
  EMAIL_FROM: string;
  FRONTEND_URL: string;
  BACKEND_URL: string;
}

/**
 * Environment Configuration
 * Centralized configuration for all environment variables
 */
export const config: Config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5003", 10),

  // Database
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/publisherauthority",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    "your-refresh-secret-key-change-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",

  // CORS - Allow multiple origins separated by comma
  // Development: '*' allows all origins
  // Production: 'http://localhost:3000,https://yourdomain.com'
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || "900000",
    10
  ), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "100",
    10
  ),

  // Email Configuration
  EMAIL_HOST: process.env.EMAIL_HOST || "smtp.hostinger.com",
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || "587", 10),
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "",
  EMAIL_FROM:
    process.env.EMAIL_FROM ||
    "Publisherauthority <Info@publisherauthority.com>",

  // Frontend URL for email links
  FRONTEND_URL: process.env.FRONTEND_URL || "https://publisherauthority.com",
  
  // Backend URL for generating image URLs
  BACKEND_URL: process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://publisherauthority.com' 
    : `http://localhost:${parseInt(process.env.PORT || "5003", 10)}`),
};

export default config;
