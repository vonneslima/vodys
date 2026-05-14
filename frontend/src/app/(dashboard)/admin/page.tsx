'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, CheckSquare, Timer, TrendingUp, UserX, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  completedTasks: number;
  totalPomodoros: number;
  newUsersThisMonth: number;
  taskCompletionRate: number;
}

interface AdminUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  _count: { tasks: number; subjects: number; pomodoroSessions: number };
}

export default function AdminPage() {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.data),
  });

  const { data: usersData, isLoading } = useQuery<{ users: AdminUser[]; total: number }>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data.data),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/users/${id}/status`, { isActive }),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`User ${isActive ? 'activated' : 'deactivated'}`);
    },
    onError: () => toast.error('Failed to update user status'),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Platform overview and management</p>
        </div>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Total Users" value={stats?.totalUsers ?? '—'} icon={Users} color="primary" />
        <MetricCard title="Active Users" value={stats?.activeUsers ?? '—'} icon={TrendingUp} color="green" />
        <MetricCard title="Total Tasks" value={stats?.totalTasks ?? '—'} icon={CheckSquare} color="blue" />
        <MetricCard title="Pomodoros" value={stats?.totalPomodoros ?? '—'} icon={Timer} color="orange" />
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">New users this month</p>
            <p className="text-3xl font-bold mt-1">{stats?.newUsersThisMonth ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Tasks completed</p>
            <p className="text-3xl font-bold mt-1">{stats?.completedTasks ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Completion rate</p>
            <p className="text-3xl font-bold mt-1">{stats?.taskCompletionRate ?? '—'}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({usersData?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Stats</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersData?.users.map((u) => (
                    <tr key={u.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={null} firstName={u.firstName} lastName={u.lastName} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u._count.tasks} tasks · {u._count.subjects} subjects
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(u.createdAt, 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.isActive ? 'success' : 'destructive'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={u.isActive ? 'text-destructive hover:bg-destructive/10' : 'text-green-500 hover:bg-green-500/10'}
                          onClick={() => toggleStatusMutation.mutate({ id: u.id, isActive: !u.isActive })}
                          disabled={toggleStatusMutation.isPending}
                        >
                          {u.isActive ? (
                            <><UserX className="mr-1.5 h-3.5 w-3.5" /> Deactivate</>
                          ) : (
                            <><UserCheck className="mr-1.5 h-3.5 w-3.5" /> Activate</>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
