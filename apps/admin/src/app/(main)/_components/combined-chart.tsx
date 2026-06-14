"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChartType, MetricMeta } from "./metrics.constants";
import type { SeriesPoint, SeriesResolution } from "@/hooks/use-platform-metrics";
import { formatBucket } from "./chart-format";

interface CombinedChartProps {
  metrics: MetricMeta[]; // the selected metrics, in display order
  points: SeriesPoint[]; // all points for the selected metrics
  chartType: ChartType;
  resolution: SeriesResolution | undefined;
  isLoading: boolean;
}

const seriesKey = (type: number) => `m${type}`;

/** One chart overlaying every selected metric on shared axes. */
export function CombinedChart({
  metrics,
  points,
  chartType,
  resolution,
  isLoading,
}: CombinedChartProps) {
  const t = useTranslations("Dashboard");
  const selectedTypes = useMemo(() => metrics.map((m) => m.type), [metrics]);

  // Pivot points → one row per bucket, a column per metric.
  const data = useMemo(() => {
    const rows = new Map<string, Record<string, number | string>>();
    for (const p of points) {
      if (!selectedTypes.includes(p.metricType)) continue;
      const row = rows.get(p.bucket) ?? {
        bucket: p.bucket,
        label: formatBucket(p.bucket, resolution),
      };
      row[seriesKey(p.metricType)] = p.cnt;
      rows.set(p.bucket, row);
    }
    return Array.from(rows.values()).sort((a, b) =>
      String(a.bucket).localeCompare(String(b.bucket)),
    );
  }, [points, selectedTypes, resolution]);

  const config = useMemo(
    () =>
      Object.fromEntries(
        metrics.map((m) => [seriesKey(m.type), { label: t(m.key), color: m.color }]),
      ),
    [metrics, t],
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t("combinedTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : data.length === 0 ? (
          <div className="text-muted-foreground flex h-[320px] items-center justify-center text-xs">
            {t("noData")}
          </div>
        ) : (
          <ChartContainer config={config} className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(chartType, data, metrics)}
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

function commonAxes(metrics: MetricMeta[]) {
  return (
    <>
      <defs>
        {metrics.map((m) => (
          <linearGradient key={m.type} id={`fill-combined-${m.type}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={m.color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={m.color} stopOpacity={0.0} />
          </linearGradient>
        ))}
      </defs>
      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
      <XAxis
        dataKey="label"
        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        tickLine={false}
        axisLine={false}
        minTickGap={32}
        tickMargin={10}
      />
      <YAxis
        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        tickLine={false}
        axisLine={false}
        width={40}
        allowDecimals={false}
        tickFormatter={(v) => compact.format(Number(v))}
        tickMargin={8}
      />
      <Tooltip
        cursor={{ fill: "hsl(var(--muted)/0.2)", strokeWidth: 1, strokeDasharray: "3 3" }}
        content={<ChartTooltipContent indicator="dot" />}
      />
      <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
    </>
  );
}

function renderChart(
  chartType: ChartType,
  data: Record<string, number | string>[],
  metrics: MetricMeta[],
) {
  const margin = { top: 20, right: 12, left: 0, bottom: 0 };

  if (chartType === "bar") {
    return (
      <BarChart data={data} margin={margin}>
        {commonAxes(metrics)}
        {metrics.map((m) => (
          <Bar
            key={m.type}
            dataKey={seriesKey(m.type)}
            stackId="all"
            fill={m.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        ))}
      </BarChart>
    );
  }

  if (chartType === "area") {
    return (
      <AreaChart data={data} margin={margin}>
        {commonAxes(metrics)}
        {metrics.map((m) => (
          <Area
            key={m.type}
            type="monotone"
            dataKey={seriesKey(m.type)}
            stroke={m.color}
            fill={`url(#fill-combined-${m.type})`}
            strokeWidth={3}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    );
  }

  return (
    <LineChart data={data} margin={margin}>
      {commonAxes(metrics)}
      {metrics.map((m) => (
        <Line
          key={m.type}
          type="monotone"
          dataKey={seriesKey(m.type)}
          stroke={m.color}
          strokeWidth={3}
          dot={{ r: 3, fill: m.color, strokeWidth: 0 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      ))}
    </LineChart>
  );
}
