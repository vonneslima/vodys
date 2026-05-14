'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CheckSquare,
  Clock,
  AlertTriangle,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { WeeklyProgressChart } from '@/components/dashboard/WeeklyProgress';
import { RecentTasks } from '@/components/dashboard/RecentTasks';
import { useAuthStore } from '@/store/authStore';
import { formatStudyTime } from '@/lib/utils';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () =>
      api.get<{ data: DashboardStats }>('/users/dashboard/stats').then((r) => r.data.data),
    refetchInterval: 5 * 60 * 1000,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {user?.firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s your study overview for today.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Total Tasks"
          value={isLoading ? '—' : stats?.totalTasks ?? 0}
          icon={CheckSquare}
          color="primary"
          className="xl:col-span-1"
        />
        <MetricCard
          title="Completed"
          value={isLoading ? '—' : stats?.completedTasks ?? 0}
          subtitle={`${stats?.completionRate ?? 0}% completion rate`}
          icon={TrendingUp}
          color="green"
          className="xl:col-span-1"
        />
        <MetricCard
          title="Overdue"
          value={isLoading ? '—' : stats?.overdueCount ?? 0}
          icon={AlertTriangle}
          color="orange"
          className="xl:col-span-1"
        />
        <MetricCard
          title="Subjects"
          value={isLoading ? '—' : stats?.subjectCount ?? 0}
          icon={BookOpen}
          color="blue"
          className="xl:col-span-1"
        />
        <MetricCard
          title="Pomodoros"
          value={isLoading ? '—' : stats?.pomodorosThisWeek ?? 0}
          subtitle="this week"
          icon={Timer}
          color="purple"
          className="xl:col-span-1"
        />
        <MetricCard
          title="Study Time"
          value={isLoading ? '—' : formatStudyTime(stats?.studyMinutesThisWeek ?? 0)}
          subtitle="this week"
          icon={Clock}
          color="primary"
          className="xl:col-span-1"
        />
      </div>

      {/* Charts + Tasks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <WeeklyProgressChart />
        </div>
        <div className="lg:col-span-2">
          <RecentTasks />
        </div>
      </div>
    </div>
  );
}
