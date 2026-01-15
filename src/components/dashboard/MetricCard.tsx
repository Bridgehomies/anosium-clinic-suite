import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

const MetricCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'bg-secondary',
}: MetricCardProps) => {
  return (
    <div className="metric-card group">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold font-display text-foreground">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  changeType === 'positive' && 'bg-emerald-50 text-emerald-600',
                  changeType === 'negative' && 'bg-red-50 text-red-600',
                  changeType === 'neutral' && 'bg-muted text-muted-foreground'
                )}
              >
                {change}
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
            iconColor
          )}
        >
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
