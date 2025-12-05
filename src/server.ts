import app from "./app";
import config from "./config/env";
import connectDB from "./config/database";
import logger from "./utils/logger";
import { startLinkMonitoring } from "./jobs/linkMonitor";
import { initializeSocket } from "./config/socket";
import { Server as HttpServer } from "http";

/**
 * Server Startup
 * Initializes database connection and starts the HTTP server
 */

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});

// Connect to MongoDB
connectDB();

// Start link monitoring cron job
if (config.NODE_ENV === 'production') {
  startLinkMonitoring();
}

// Start server
const PORT = config.PORT;
const server: HttpServer = app.listen(PORT, () => {
  logger.info("=".repeat(50));
  logger.info(`🚀 Server is running on port ${PORT}`);
  logger.info(`📝 Environment: ${config.NODE_ENV}`);
  logger.info(`🌐 API URL: http://localhost:${PORT}/api/v1`);
  if (config.NODE_ENV === 'production') {
    logger.info(`🔗 Link monitoring: Active (daily at 2 AM)`);
  }
  logger.info("=".repeat(50));
});

// Initialize Socket.IO
initializeSocket(server);
logger.info("🔌 Socket.IO initialized");

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    logger.info("💥 Process terminated!");
  });
});
