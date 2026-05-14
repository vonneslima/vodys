'use client';

import { useQuery } from '@tanstack/react-query';
import { Timer, Flame, Clock, Target } from 'lucide-react';
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { api } from '@/lib/api';
import { formatDate, formatDuration } from '@/lib/utils';
import type { PomodoroSession } from '@/types';

interface PomodoroStats {
  totalSessions: number;
  totalMinutes: number;
  totalHours: number;
  currentStreak: number;
}

export default function PomodoroPage() {
  const { data: stats } = useQuery<PomodoroStats>({
    queryKey: ['pomodoro-stats'],
    queryFn: () => api.get('/pomodoro/stats').then((r) => r.data.data),
  });

  const { data: history } = useQuery<PomodoroSession[]>({
    queryKey: ['pomodoro-history'],
    queryFn: () => api.get('/pomodoro/history?limit=10').then((r) => r.data.data),
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
        <p className="text-muted-foreground mt-0.5">Stay focused with timed work sessions</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Timer */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="flex flex-col items-center py-10">
              <PomodoroTimer />
            </CardContent>
          </Card>
        </div>

        {/* Stats + History */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              title="Total Sessions"
              value={stats?.totalSessions ?? 0}
              icon={Target}
              color="primary"
            />
            <MetricCard
              title="Streak"
              value={`${stats?.currentStreak ?? 0}d`}
              icon={Flame}
              color="orange"
            />
            <MetricCard
              title="Total Hours"
              value={`${stats?.totalHours ?? 0}h`}
              icon={Clock}
              color="blue"
            />
            <MetricCard
              title="Minutes"
              value={stats?.totalMinutes ?? 0}
              icon={Timer}
              color="green"
            />
          </div>

          {/* Recent sessions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {!history?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No sessions yet</p>
              ) : (
                history.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium capitalize">{s.type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.completedAt ? formatDate(s.completedAt, 'MMM d, h:mm a') : '—'}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {formatDuration(s.durationMin)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
