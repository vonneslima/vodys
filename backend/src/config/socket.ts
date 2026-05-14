import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { prisma } from './database';

interface SocketData {
  userId: string;
  username: string;
}

// Map of userId -> Set of socket IDs for multi-tab support
const userSockets = new Map<string, Set<string>>();

export const initSocket = (io: Server): void => {
  // Auth middleware for socket connections
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub, isActive: true },
        select: { id: true, username: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data = { userId: user.id, username: user.username } as SocketData;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, username } = socket.data as SocketData;

    // Track connected sockets per user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // Join personal room for targeted events
    socket.join(`user:${userId}`);

    logger.info(`Socket connected: ${username} (${socket.id})`);

    // Mark pending notifications as delivered
    socket.emit('connection:established', {
      userId,
      timestamp: new Date().toISOString(),
    });

    // Handle joining study rooms (collaborative features)
    socket.on('room:join', (roomId: string) => {
      socket.join(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('room:user_joined', { userId, username });
    });

    socket.on('room:leave', (roomId: string) => {
      socket.leave(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('room:user_left', { userId, username });
    });

    // Pomodoro sync across tabs
    socket.on('pomodoro:start', (data) => {
      io.to(`user:${userId}`).emit('pomodoro:sync', { action: 'start', ...data });
    });

    socket.on('pomodoro:pause', (data) => {
      io.to(`user:${userId}`).emit('pomodoro:sync', { action: 'pause', ...data });
    });

    socket.on('pomodoro:stop', (data) => {
      io.to(`user:${userId}`).emit('pomodoro:sync', { action: 'stop', ...data });
    });

    // Task status updates (realtime board sync)
    socket.on('task:status_change', (data) => {
      io.to(`user:${userId}`).emit('task:updated', data);
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
      logger.info(`Socket disconnected: ${username} (${reason})`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for ${username}:`, err);
    });
  });
};

// Emit notification to specific user (called from services)
export const emitToUser = (io: Server, userId: string, event: string, data: unknown): void => {
  io.to(`user:${userId}`).emit(event, data);
};

export const isUserOnline = (userId: string): boolean => {
  return userSockets.has(userId) && (userSockets.get(userId)?.size ?? 0) > 0;
};
