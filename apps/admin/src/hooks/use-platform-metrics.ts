import { useMemo } from 'react';
import useSWR from 'swr';
import type { RangeConfig } from '@/app/(main)/_components/metrics.constants';

export interface PlatformTotals {
  sessionsCount: number;
  commentsCount: number;
  messagesCount: number;
  leadsCount: number;
  leadInstagramsCount: number;
}

export type SeriesResolution = '1h' | '1d';

export interface SeriesPoint {
  bucket: string;
  metricType: number;
  cnt: number;
}

export interface PlatformSeries {
  resolution: SeriesResolution;
  from: string;
  to: string;
  points: SeriesPoint[];
}

// Responses are ResponseMessage-wrapped (CLAUDE.md §8); the SWR fetcher returns
// the axios body, so the payload lives under `.data`.
interface Wrapped<T> {
  data: T;
}

export function usePlatformTotals() {
  const { data, error, isLoading } = useSWR<Wrapped<PlatformTotals>>('/metrics/platform/totals');
  return {
    totals: data?.data ?? null,
    isLoading,
    isError: !!error,
  };
}

function seriesUrl(range: RangeConfig): string {
  if (range.mode === 'custom') {
    const params = new URLSearchParams({ from: range.from, to: range.to });
    return `/metrics/platform/series?${params.toString()}`;
  }
  return `/metrics/platform/series?days=${range.days}`;
}

export function usePlatformSeries(range: RangeConfig) {
  const { data, error, isLoading } = useSWR<Wrapped<PlatformSeries>>(seriesUrl(range));
  const series = data?.data ?? null;

  // Group points by metricType for per-metric charts, and sum each metric's
  // buckets for the per-card range delta.
  const { byMetric, deltas } = useMemo(() => {
    const byMetric = new Map<number, SeriesPoint[]>();
    const deltas = new Map<number, number>();
    for (const p of series?.points ?? []) {
      const list = byMetric.get(p.metricType) ?? [];
      list.push(p);
      byMetric.set(p.metricType, list);
      deltas.set(p.metricType, (deltas.get(p.metricType) ?? 0) + p.cnt);
    }
    return { byMetric, deltas };
  }, [series]);

  return { series, byMetric, deltas, isLoading, isError: !!error };
}
