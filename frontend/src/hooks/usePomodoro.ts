'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { pomodoroToSeconds, formatTimer } from '@/lib/utils';
import type { PomodoroSession, PomodoroType } from '@/types';

type TimerState = 'idle' | 'running' | 'paused' | 'finished';

interface PomodoroConfig {
  workMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  longBreakInterval: number;
}

const DEFAULT_CONFIG: PomodoroConfig = {
  workMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  longBreakInterval: 4,
};

export function usePomodoro(config: Partial<PomodoroConfig> = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const queryClient = useQueryClient();

  const [type, setType] = useState<PomodoroType>('work');
  const [state, setState] = useState<TimerState>('idle');
  const [secondsLeft, setSecondsLeft] = useState(pomodoroToSeconds(cfg.workMin));
  const [sessionCount, setSessionCount] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const durationForType = useCallback(
    (t: PomodoroType): number => {
      if (t === 'work') return cfg.workMin;
      if (t === 'short_break') return cfg.shortBreakMin;
      return cfg.longBreakMin;
    },
    [cfg.workMin, cfg.shortBreakMin, cfg.longBreakMin]
  );

  const startMutation = useMutation({
    mutationFn: (data: { durationMin: number; type: PomodoroType }) =>
      api.post<{ data: PomodoroSession }>('/pomodoro/start', data).then((r) => r.data.data),
    onSuccess: (session) => setActiveSessionId(session.id),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/pomodoro/${id}/complete`).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pomodoro-history'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/pomodoro/${id}/cancel`),
  });

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        setState('finished');
        return 0;
      }
      return prev - 1;
    });
  }, []);

  const start = useCallback(() => {
    const duration = durationForType(type);
    startMutation.mutate({ durationMin: duration, type });
    setState('running');
    setSecondsLeft(pomodoroToSeconds(duration));
  }, [type, durationForType, startMutation]);

  const pause = useCallback(() => {
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    setState('running');
  }, []);

  const stop = useCallback(() => {
    if (activeSessionId) {
      cancelMutation.mutate(activeSessionId);
      setActiveSessionId(null);
    }
    setState('idle');
    setSecondsLeft(pomodoroToSeconds(durationForType(type)));
  }, [activeSessionId, cancelMutation, type, durationForType]);

  const switchType = useCallback(
    (newType: PomodoroType) => {
      stop();
      setType(newType);
      setSecondsLeft(pomodoroToSeconds(durationForType(newType)));
    },
    [stop, durationForType]
  );

  // Handle finish
  useEffect(() => {
    if (state === 'finished' && activeSessionId) {
      completeMutation.mutate(activeSessionId);
      setActiveSessionId(null);

      if (type === 'work') {
        const newCount = sessionCount + 1;
        setSessionCount(newCount);
        // Auto-suggest break type
        const nextType =
          newCount % cfg.longBreakInterval === 0 ? 'long_break' : 'short_break';
        setType(nextType);
        setSecondsLeft(pomodoroToSeconds(durationForType(nextType)));
      } else {
        setType('work');
        setSecondsLeft(pomodoroToSeconds(cfg.workMin));
      }

      setState('idle');

      // Browser notification
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Vodys', {
            body: type === 'work' ? '🎉 Focus session complete! Time for a break.' : '💪 Break over. Back to work!',
            icon: '/favicon.ico',
          });
        }
      }
    }
  }, [state, activeSessionId, type, sessionCount, cfg, durationForType, completeMutation]);

  // Timer tick
  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, tick]);

  // Update page title
  useEffect(() => {
    if (state === 'running') {
      document.title = `${formatTimer(secondsLeft)} — Vodys`;
    } else {
      document.title = 'Vodys — Study Smarter';
    }
  }, [state, secondsLeft]);

  const totalSeconds = pomodoroToSeconds(durationForType(type));
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return {
    type,
    state,
    secondsLeft,
    timeDisplay: formatTimer(secondsLeft),
    progress,
    sessionCount,
    isRunning: state === 'running',
    isPaused: state === 'paused',
    isIdle: state === 'idle',
    start,
    pause,
    resume,
    stop,
    switchType,
    isStarting: startMutation.isPending,
  };
}
