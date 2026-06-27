'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { SeriesResolution } from '@/hooks/use-platform-metrics';
import type { RevenueSeriesPoint } from '@/types/finance';
import { InvoiceStatusEnum } from '@/types/finance';
import {
  INVOICE_STATUSES,
  invoiceStatusChartColor,
  invoiceStatusLabels,
} from '@/constants/invoice-status';
import { formatBucket } from '../../_components/chart-format';

interface RevenueChartProps {
  points: RevenueSeriesPoint[];
  resolution: SeriesResolution | undefined;
  /** Statuses to render as stacked bands. Empty → all statuses. */
  statuses: InvoiceStatusEnum[];
  isLoading: boolean;
}

const compact = new Intl.NumberFormat('fa-IR', { notation: 'compact' });

/** Stacked revenue bars: one band per invoice status, per time-bucket. */
export function RevenueChart({ points, resolution, statuses, isLoading }: RevenueChartProps) {
  const t = useTranslations('Finance');

  const visibleStatuses = useMemo(
    () =>
      statuses.length ? INVOICE_STATUSES.filter((s) => statuses.includes(s)) : INVOICE_STATUSES,
    [statuses],
  );

  // Pivot points → one row per bucket, a column per status.
  const data = useMemo(() => {
    const rows = new Map<string, Record<string, number | string>>();
    for (const p of points) {
      const row = rows.get(p.bucket) ?? {
        bucket: p.bucket,
        label: formatBucket(p.bucket, resolution),
      };
      row[p.status] = ((row[p.status] as number) ?? 0) + p.amount;
      rows.set(p.bucket, row);
    }
    return Array.from(rows.values()).sort((a, b) =>
      String(a.bucket).localeCompare(String(b.bucket)),
    );
  }, [points, resolution]);

  const config = useMemo(
    () =>
      Object.fromEntries(
        visibleStatuses.map((s) => [
          s,
          { label: invoiceStatusLabels[s], color: invoiceStatusChartColor[s] },
        ]),
      ),
    [visibleStatuses],
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t('chartTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : data.length === 0 ? (
          <div className="text-muted-foreground flex h-[320px] items-center justify-center text-xs">
            {t('noData')}
          </div>
        ) : (
          <ChartContainer config={config} className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 15, right: 12, left: 0, bottom: 0 }}>
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
                  width={48}
                  tickFormatter={(v) => compact.format(Number(v))}
                  tickMargin={8}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.2)', strokeWidth: 1, strokeDasharray: '3 3' }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                {visibleStatuses.map((s) => (
                  <Bar
                    key={s}
                    dataKey={s}
                    name={invoiceStatusLabels[s]}
                    stackId="revenue"
                    fill={invoiceStatusChartColor[s]}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
