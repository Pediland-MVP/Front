'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  useHowFoundUsBreakdown,
  usePlatformSeries,
  usePlatformTotals,
} from '@/hooks/use-platform-metrics';
import { METRICS } from './metrics.constants';
import { useViewConfig } from './use-view-config';
import { CustomizationBar } from './customization-bar';
import { MetricCard } from './metric-card';
import { MetricChart } from './metric-chart';
import { CombinedChart } from './combined-chart';
import { HowFoundUsChart } from './how-found-us-chart';

export function MetricsOverview() {
  const t = useTranslations('Dashboard');
  const view = useViewConfig();
  const { config } = view;

  const { totals, isLoading: totalsLoading } = usePlatformTotals();
  const { series, byMetric, deltas, isLoading: seriesLoading } = usePlatformSeries(config.range);
  const { breakdown, isLoading: howFoundUsLoading } = useHowFoundUsBreakdown(config.range);

  // The metrics selected for this view, in canonical display order.
  const selectedMetrics = useMemo(
    () => METRICS.filter((m) => config.metrics.includes(m.type)),
    [config.metrics],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
      </div>

      <CustomizationBar view={view} />

      {/* Count cards: all-time total + range delta, for the selected metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {selectedMetrics.map((m) => (
          <MetricCard
            key={m.type}
            metric={m}
            total={totals ? totals[m.totalsField] : null}
            delta={seriesLoading ? null : (deltas.get(m.type) ?? 0)}
            isLoading={totalsLoading}
          />
        ))}
      </div>

      {/* Charts: grid of per-metric charts, or one combined overlay */}
      {config.layout === 'combined' ? (
        <CombinedChart
          metrics={selectedMetrics}
          points={series?.points ?? []}
          chartType={config.chartType}
          resolution={series?.resolution}
          isLoading={seriesLoading}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {selectedMetrics.map((m) => (
            <MetricChart
              key={m.type}
              metric={m}
              points={byMetric.get(m.type) ?? []}
              chartType={config.chartType}
              resolution={series?.resolution}
              isLoading={seriesLoading}
            />
          ))}
        </div>
      )}

      {/* Categorical breakdown, not a selectable time-series metric — always shown. */}
      <HowFoundUsChart items={breakdown?.items ?? null} isLoading={howFoundUsLoading} />
    </div>
  );
}
