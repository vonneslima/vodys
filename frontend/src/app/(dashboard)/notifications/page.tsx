'use client';

import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRelative } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/types';

const TYPE_LABELS: Record<NotificationType, string> = {
  TASK_DUE: 'Task Due',
  TASK_ASSIGNED: 'Assignment',
  POMODORO_COMPLETE: 'Pomodoro',
  SYSTEM: 'System',
  REMINDER: 'Reminder',
};

const TYPE_COLORS: Record<NotificationType, string> = {
  TASK_DUE: 'warning',
  TASK_ASSIGNED: 'info',
  POMODORO_COMPLETE: 'success',
  SYSTEM: 'secondary',
  REMINDER: 'default',
};

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => markAllAsRead()}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <Bell className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">You&apos;re all caught up!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                'transition-colors hover:bg-accent/30',
                !n.isRead && 'border-primary/30 bg-primary/5'
              )}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full',
                  n.isRead ? 'bg-muted-foreground/30' : 'bg-primary'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn('text-sm', !n.isRead && 'font-semibold')}>{n.title}</p>
                    <Badge variant={TYPE_COLORS[n.type] as 'default' | 'secondary' | 'outline' | 'destructive'} className="text-[10px] h-4 px-1.5">
                      {TYPE_LABELS[n.type]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1.5">{formatRelative(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!n.isRead && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markAsRead(n.id)} title="Mark as read">
                      <CheckCheck className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteNotification(n.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
