module.exports = {
  apps: [{
    name: 'publisherauthority-backend',
    script: './dist/server.js',
    instances: 1,
    exec_mode: 'fork',  // Changed from 'cluster' to 'fork' for lower CPU usage
    max_memory_restart: '500M',  // Auto-restart if memory exceeds 500MB
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};

