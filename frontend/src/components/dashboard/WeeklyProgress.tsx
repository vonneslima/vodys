'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { formatStudyTime } from '@/lib/utils';
import type { WeeklyProgress } from '@/types';

interface TooltipPayload {
  value: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-sm">
      <p className="font-medium">{label}</p>
      <p className="text-primary">{formatStudyTime(payload[0].value)}</p>
    </div>
  );
};

export function WeeklyProgressChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['weekly-progress'],
    queryFn: async () => {
      const res = await api.get<{ data: WeeklyProgress[] }>('/users/dashboard/weekly-progress');
      return res.data.data;
    },
  });

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const totalMinutes = data?.reduce((sum, d) => sum + d.minutes, 0) ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Weekly Study Time</CardTitle>
            <CardDescription>Last 7 days — {formatStudyTime(totalMinutes)} total</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `${v}m`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
              <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                {data?.map((entry) => (
                  <Cell
                    key={entry.date}
                    fill={
                      entry.label === today
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--primary)/0.35)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
