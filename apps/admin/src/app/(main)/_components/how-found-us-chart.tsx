'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { HowFoundUsBreakdownItem } from '@/hooks/use-platform-metrics';

const CHART_COLOR = 'rgb(8 145 178)';

interface HowFoundUsChartProps {
  items: HowFoundUsBreakdownItem[] | null;
  isLoading: boolean;
}

/** Horizontal bar chart ranking `howFoundUs` values by count, for the selected range. */
export function HowFoundUsChart({ items, isLoading }: HowFoundUsChartProps) {
  const t = useTranslations('Dashboard');
  const tUsers = useTranslations('Users');

  const data = useMemo(
    () =>
      (items ?? []).map((item) => ({
        key: item.key,
        label: item.key === 'not_set' ? tUsers('howFoundUs_none') : tUsers(`options.${item.key}`),
        count: item.count,
      })),
    [items, tUsers],
  );

  const hasData = data.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t('howFoundUsTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : !hasData ? (
          <div className="text-muted-foreground flex h-[320px] items-center justify-center text-xs">
            {t('noData')}
          </div>
        ) : (
          <ChartContainer
            config={{ count: { label: t('howFoundUsTitle'), color: CHART_COLOR } }}
            className="h-[320px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={140}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="count" fill={CHART_COLOR} radius={[0, 4, 4, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
