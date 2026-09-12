'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlatformBusinessStats } from '@/hooks/use-platform-metrics';
import type { RangeConfig } from './metrics.constants';

const nf = new Intl.NumberFormat('fa-IR');

// Kept separate from `METRICS`: these four are live counts, not CQRS
// time-series, so they are never selectable in the metric picker and never get
// a chart. The colors only tint the dot and the footer number, matching
// `MetricCard`'s visual language.
const PAID_SUBSCRIPTIONS_COLOR = 'rgb(219 39 119)';
const INSTAGRAMS_COLOR = 'rgb(99 102 241)';
const ACTIVE_INSTAGRAMS_COLOR = 'rgb(22 163 74)';
const COMMERCE_ORDERS_COLOR = 'rgb(234 88 12)';

interface StatCardProps {
  label: string;
  color: string;
  value: number | null;
  footer: React.ReactNode;
  isLoading: boolean;
  isError: boolean;
}

function StatCard({ label, color, value, footer, isLoading, isError }: StatCardProps) {
  // A failed fetch leaves `isLoading` false and `value` null, so the skeleton
  // must be gated on loading alone — otherwise an error reads as a spinner that
  // never resolves.
  const showSkeleton = isLoading && !isError;
  const hasValue = !isLoading && !isError && value !== null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </CardDescription>
        <CardTitle className="text-2xl tabular-nums">
          {showSkeleton ? <Skeleton className="h-7 w-24" /> : hasValue ? nf.format(value) : '—'}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">
        {showSkeleton ? <Skeleton className="h-4 w-20" /> : hasValue ? footer : null}
      </CardContent>
    </Card>
  );
}

/**
 * Business counters for the dashboard, always visible under the metric cards.
 *
 * Three of the four read as "all-time total, plus what this range added". The
 * paid-subscriptions card is the exception: its number IS the range, so its
 * footer carries the active/reserved split instead of a delta.
 */
export function BusinessStatsCards({ range }: { range: RangeConfig }) {
  const t = useTranslations('Dashboard');
  const { stats, isLoading, isError } = usePlatformBusinessStats(range);

  const delta = (n: number, color: string) => (
    <span>
      <span style={{ color }}>+{nf.format(n)}</span> {t('thisPeriod')}
    </span>
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={t('paidSubscriptions')}
        color={PAID_SUBSCRIPTIONS_COLOR}
        value={stats?.paidSubscriptions.total ?? null}
        isLoading={isLoading}
        isError={isError}
        footer={
          <span>
            {t('paidActive')} {nf.format(stats?.paidSubscriptions.active ?? 0)}
            {' · '}
            {t('paidReserved')} {nf.format(stats?.paidSubscriptions.reserved ?? 0)}
            {' · '}
            {t('thisPeriod')}
          </span>
        }
      />

      <StatCard
        label={t('totalInstagrams')}
        color={INSTAGRAMS_COLOR}
        value={stats?.instagrams.total ?? null}
        isLoading={isLoading}
        isError={isError}
        footer={delta(stats?.instagrams.delta ?? 0, INSTAGRAMS_COLOR)}
      />

      <StatCard
        label={t('activeInstagrams')}
        color={ACTIVE_INSTAGRAMS_COLOR}
        value={stats?.activeInstagrams.total ?? null}
        isLoading={isLoading}
        isError={isError}
        footer={delta(stats?.activeInstagrams.delta ?? 0, ACTIVE_INSTAGRAMS_COLOR)}
      />

      <StatCard
        label={t('commerceOrders')}
        color={COMMERCE_ORDERS_COLOR}
        value={stats?.commerceOrders.total ?? null}
        isLoading={isLoading}
        isError={isError}
        footer={delta(stats?.commerceOrders.delta ?? 0, COMMERCE_ORDERS_COLOR)}
      />
    </div>
  );
}
