'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import type { Notification } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const connect = useCallback(() => {
    if (!accessToken || socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    // Handle incoming notifications
    socket.on('notification:new', (notification: Notification) => {
      addNotification(notification);
    });

    // Pomodoro sync across tabs
    socket.on('pomodoro:sync', (data: { action: string; [key: string]: unknown }) => {
      window.dispatchEvent(new CustomEvent('pomodoro:sync', { detail: data }));
    });

    // Task realtime updates
    socket.on('task:updated', (data) => {
      window.dispatchEvent(new CustomEvent('task:updated', { detail: data }));
    });

    socketRef.current = socket;
  }, [accessToken, addNotification]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  return { socket: socketRef.current, emit, isConnected: socketRef.current?.connected ?? false };
}
