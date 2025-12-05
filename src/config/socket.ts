import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from './env';
import User from '../modules/auth/auth.model';
import logger from '../utils/logger';

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(server: HttpServer): SocketIOServer {
  // Allow both development and production origins
  const allowedOrigins = config.NODE_ENV === 'production' 
    ? [config.FRONTEND_URL || 'https://publisherauthority.com']
    : ['http://localhost:3000', 'http://localhost:3001', config.FRONTEND_URL || 'http://localhost:3000'];
  
  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string };
      const user = await User.findById(decoded.id).select('role email');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.data.user = {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      };

      next();
    } catch (error: any) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    logger.info(`Socket connected: ${user.email} (${user.role})`);

    // Join admin room if user is admin
    if (user.role === 'admin') {
      socket.join('admin');
      logger.info(`Admin ${user.email} joined admin room`);
    }

    // Join user-specific room
    socket.join(`user:${user.id}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${user.email}`);
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
}

/**
 * Emit notification to admin users
 */
export function emitAdminNotification(type: string, data: any) {
  const socketIO = getIO();
  socketIO.to('admin').emit('notification', {
    type,
    data,
    timestamp: new Date().toISOString(),
  });
  logger.info(`Admin notification emitted: ${type}`);
}

/**
 * Emit notification to specific user
 */
export function emitUserNotification(userId: string, type: string, data: any) {
  const socketIO = getIO();
  socketIO.to(`user:${userId}`).emit('notification', {
    type,
    data,
    timestamp: new Date().toISOString(),
  });
  logger.info(`User notification emitted: ${type} to user ${userId}`);
}

