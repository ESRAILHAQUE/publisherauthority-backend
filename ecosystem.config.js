module.exports = {
  apps: [
    {
      name: "publisherauthority-backend",
      script: "./dist/server.js",
      instances: 1,
      exec_mode: "fork", // Changed from 'cluster' to 'fork' for lower CPU usage
      max_memory_restart: "600M", // Increased from 500M to prevent premature restarts
      min_uptime: "30s", // Increased from 10s to prevent premature restarts
      max_restarts: 5, // Reduced from 10 to prevent restart loops
      restart_delay: 5000, // Increased delay between restarts (5 seconds)
      kill_timeout: 10000, // Increased graceful shutdown timeout
      listen_timeout: 15000, // Increased wait time for app to listen
      env_file: ".env", // Load environment variables from .env file
      env: {
        NODE_ENV: "production",
        PORT: 5003,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true,
      merge_logs: true,
      autorestart: true,
      exp_backoff_restart_delay: 100, // Exponential backoff for restarts
    },
  ],
};
