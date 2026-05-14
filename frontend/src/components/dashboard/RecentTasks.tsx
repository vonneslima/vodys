'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useTasks } from '@/hooks/useTasks';
import { PRIORITY_CONFIG, formatRelative, isOverdue } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

const STATUS_ICONS = {
  TODO: Circle,
  IN_PROGRESS: Clock,
  DONE: CheckCircle2,
  CANCELLED: AlertCircle,
};

function TaskRow({ task }: { task: Task }) {
  const Icon = STATUS_ICONS[task.status];
  const overdue = isOverdue(task.dueDate, task.status);
  const priorityCfg = PRIORITY_CONFIG[task.priority];

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          task.status === 'DONE' ? 'text-green-500' : 'text-muted-foreground'
        )}
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            task.status === 'DONE' && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.subject && (
            <span
              className="inline-block h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: task.subject.color }}
            />
          )}
          {task.dueDate && (
            <span className={cn('text-xs', overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
              {overdue ? 'Overdue · ' : ''}{formatRelative(task.dueDate)}
            </span>
          )}
        </div>
      </div>
      <Badge className={cn('shrink-0 text-[10px]', priorityCfg.bg, priorityCfg.color)} variant="outline">
        {priorityCfg.label}
      </Badge>
    </div>
  );
}

export function RecentTasks() {
  const { tasks, isLoading } = useTasks({ limit: 5, sortBy: 'dueDate' } as Parameters<typeof useTasks>[0]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming Tasks</CardTitle>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
            <Link href="/tasks">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-2.5 w-1/3 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-green-500/40" />
            <p className="mt-2 text-sm text-muted-foreground">All caught up! No pending tasks.</p>
          </div>
        ) : (
          <div>
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
