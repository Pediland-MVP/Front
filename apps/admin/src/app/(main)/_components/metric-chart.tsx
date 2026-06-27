'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartType, MetricMeta } from './metrics.constants';
import type { SeriesPoint, SeriesResolution } from '@/hooks/use-platform-metrics';
import { formatBucket } from './chart-format';

interface MetricChartProps {
  metric: MetricMeta;
  points: SeriesPoint[];
  chartType: ChartType;
  resolution: SeriesResolution | undefined;
  isLoading: boolean;
}

export function MetricChart({
  metric,
  points,
  chartType,
  resolution,
  isLoading,
}: MetricChartProps) {
  const t = useTranslations('Dashboard');

  const data = useMemo(
    () =>
      points.map((p) => ({
        label: formatBucket(p.bucket, resolution),
        cnt: p.cnt,
      })),
    [points, resolution],
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t(metric.key)}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[140px] w-full" />
        ) : data.length === 0 ? (
          <div className="text-muted-foreground flex h-[140px] items-center justify-center text-xs">
            {t('noData')}
          </div>
        ) : (
          <ChartContainer
            config={{ cnt: { label: t(metric.key), color: metric.color } }}
            className="h-[140px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(chartType, data, metric.color, metric.type)}
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

import { LabelList } from 'recharts';

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

function renderChart(
  chartType: ChartType,
  data: { label: string; cnt: number }[],
  color: string,
  metricType: number,
) {
  const margin = { top: 20, right: 10, left: 0, bottom: 0 };
  const gradientId = `fill-metric-${metricType}`;
  const axes = (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.4} />
          <stop offset="95%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
      <XAxis
        dataKey="label"
        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        tickLine={false}
        axisLine={false}
        minTickGap={32}
        tickMargin={10}
      />
      <YAxis
        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        tickLine={false}
        axisLine={false}
        width={40}
        allowDecimals={false}
        tickFormatter={(v) => compact.format(Number(v))}
        tickMargin={8}
      />
      <Tooltip
        cursor={{ fill: 'hsl(var(--muted)/0.2)', strokeWidth: 1, strokeDasharray: '3 3' }}
        content={<ChartTooltipContent indicator="dot" />}
      />
    </>
  );

  if (chartType === 'bar') {
    return (
      <BarChart data={data} margin={margin}>
        {axes}
        <Bar dataKey="cnt" fill={color} radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    );
  }

  if (chartType === 'area') {
    return (
      <AreaChart data={data} margin={margin}>
        {axes}
        <Area
          type="monotone"
          dataKey="cnt"
          stroke={color}
          fill={`url(#${gradientId})`}
          strokeWidth={3}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </AreaChart>
    );
  }

  return (
    <LineChart data={data} margin={margin}>
      {axes}
      <Line
        type="monotone"
        dataKey="cnt"
        stroke={color}
        strokeWidth={3}
        dot={{ r: 3, fill: color, strokeWidth: 0 }}
        activeDot={{ r: 6, strokeWidth: 0 }}
      />
    </LineChart>
  );
}
