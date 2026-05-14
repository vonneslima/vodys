import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  color?: 'primary' | 'green' | 'orange' | 'blue' | 'purple';
  className?: string;
}

const COLOR_MAP = {
  primary: 'bg-primary/10 text-primary',
  green: 'bg-green-500/10 text-green-500',
  orange: 'bg-orange-500/10 text-orange-500',
  blue: 'bg-blue-500/10 text-blue-500',
  purple: 'bg-purple-500/10 text-purple-500',
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('animate-fade-in', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'mt-2 text-xs font-medium',
                  trend.positive !== false ? 'text-green-500' : 'text-red-500'
                )}
              >
                {trend.value > 0 ? '+' : ''}
                {trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', COLOR_MAP[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
