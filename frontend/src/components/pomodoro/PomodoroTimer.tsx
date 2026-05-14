'use client';

import { useEffect } from 'react';
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { usePomodoro } from '@/hooks/usePomodoro';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { PomodoroType } from '@/types';

const TYPE_CONFIG: Record<PomodoroType, { label: string; color: string; description: string }> = {
  work: { label: 'Focus', color: 'hsl(var(--primary))', description: 'Deep work session' },
  short_break: { label: 'Short Break', color: '#10b981', description: 'Quick recharge' },
  long_break: { label: 'Long Break', color: '#3b82f6', description: 'Extended rest' },
};

const CIRCUMFERENCE = 2 * Math.PI * 88; // r=88

export function PomodoroTimer() {
  const { type, state, secondsLeft, timeDisplay, progress, sessionCount, isRunning, isPaused, isIdle, start, pause, resume, stop, switchType } =
    usePomodoro();

  const cfg = TYPE_CONFIG[type];
  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Type selector */}
      <div className="flex gap-2 rounded-xl bg-muted p-1">
        {(Object.keys(TYPE_CONFIG) as PomodoroType[]).map((t) => (
          <button
            key={t}
            onClick={() => switchType(t)}
            disabled={isRunning}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed',
              type === t
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {TYPE_CONFIG[t].label}
          </button>
        ))}
      </div>

      {/* Circular timer */}
      <div className="relative flex items-center justify-center">
        <svg width="220" height="220" className="-rotate-90">
          {/* Background track */}
          <circle
            cx="110"
            cy="110"
            r="88"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
          />
          {/* Progress arc */}
          <circle
            cx="110"
            cy="110"
            r="88"
            fill="none"
            stroke={cfg.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        {/* Timer text */}
        <div className="absolute flex flex-col items-center gap-1">
          <span
            className="text-5xl font-bold tabular-nums tracking-tighter"
            aria-live="polite"
            aria-label={`${timeDisplay} remaining`}
          >
            {timeDisplay}
          </span>
          <span className="text-sm text-muted-foreground">{cfg.description}</span>
          {sessionCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {sessionCount} session{sessionCount !== 1 ? 's' : ''} today
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {(isRunning || isPaused) && (
          <Button variant="outline" size="icon" className="h-12 w-12" onClick={stop} aria-label="Stop">
            <Square className="h-5 w-5" />
          </Button>
        )}

        {isIdle ? (
          <Button
            className="h-14 w-14 rounded-full shadow-lg"
            size="icon"
            onClick={start}
            style={{ backgroundColor: cfg.color }}
            aria-label="Start"
          >
            <Play className="h-6 w-6 fill-current" />
          </Button>
        ) : isRunning ? (
          <Button
            className="h-14 w-14 rounded-full shadow-lg"
            size="icon"
            onClick={pause}
            style={{ backgroundColor: cfg.color }}
            aria-label="Pause"
          >
            <Pause className="h-6 w-6 fill-current" />
          </Button>
        ) : (
          <Button
            className="h-14 w-14 rounded-full shadow-lg"
            size="icon"
            onClick={resume}
            style={{ backgroundColor: cfg.color }}
            aria-label="Resume"
          >
            <Play className="h-6 w-6 fill-current" />
          </Button>
        )}

        {(isRunning || isPaused) && (
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={() => switchType(type === 'work' ? 'short_break' : 'work')}
            aria-label="Skip"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Session dots */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              i < (sessionCount % 4) ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>
    </div>
  );
}
