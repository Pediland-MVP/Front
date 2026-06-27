'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { MetricMeta } from './metrics.constants';

interface MetricCardProps {
  metric: MetricMeta;
  total: number | null;
  delta: number | null;
  isLoading: boolean;
}

const nf = new Intl.NumberFormat('fa-IR');

export function MetricCard({ metric, total, delta, isLoading }: MetricCardProps) {
  const t = useTranslations('Dashboard');
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: metric.color }}
          />
          {t(metric.key)}
        </CardDescription>
        <CardTitle className="text-2xl tabular-nums">
          {isLoading || total === null ? <Skeleton className="h-7 w-24" /> : nf.format(total)}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">
        {isLoading || delta === null ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <span>
            <span style={{ color: metric.color }}>+{nf.format(delta)}</span> {t('thisPeriod')}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
