'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

export function KPICard({ title, current, target, unit = '', trend, trendValue }: KPICardProps) {
  const percentage = (current / target) * 100;
  const isGood = percentage >= 80;
  const isWarning = percentage >= 60 && percentage < 80;
  const isBad = percentage < 60;

  const progressColor = isGood ? 'bg-green-500' : isWarning ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trend && (
          <div className={`flex items-center text-xs ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' && <ArrowUp className="h-3 w-3" />}
            {trend === 'down' && <ArrowDown className="h-3 w-3" />}
            {trend === 'stable' && <Minus className="h-3 w-3" />}
            <span className="ml-1">{trendValue}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {current.toLocaleString()}{unit}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Target: {target.toLocaleString()}{unit}
        </p>
        <Progress value={percentage} className="mt-3 h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {percentage.toFixed(1)}% of target
        </p>
      </CardContent>
    </Card>
  );
}
