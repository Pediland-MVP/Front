import { useMemo } from 'react';
import useSWR from 'swr';
import type { RangeConfig } from '@/app/(main)/_components/metrics.constants';

export interface PlatformTotals {
  sessionsCount: number;
  commentsCount: number;
  messagesCount: number;
  leadsCount: number;
  leadInstagramsCount: number;
  usersCount: number;
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

export interface HowFoundUsBreakdownItem {
  key: string; // a HOW_FOUND_US_ENUM value, or 'not_set'
  count: number;
}

export interface HowFoundUsBreakdown {
  from: string;
  to: string;
  items: HowFoundUsBreakdownItem[];
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

/** `days`/`from`/`to` query params shared by every `/metrics/platform/*` endpoint that takes a range. */
function rangeParams(range: RangeConfig): URLSearchParams {
  if (range.mode === 'custom') {
    return new URLSearchParams({ from: range.from, to: range.to });
  }
  return new URLSearchParams({ days: String(range.days) });
}

function seriesUrl(range: RangeConfig): string {
  return `/metrics/platform/series?${rangeParams(range).toString()}`;
}

function howFoundUsUrl(range: RangeConfig): string {
  return `/metrics/platform/how-found-us?${rangeParams(range).toString()}`;
}

export function useHowFoundUsBreakdown(range: RangeConfig) {
  const { data, error, isLoading } = useSWR<Wrapped<HowFoundUsBreakdown>>(howFoundUsUrl(range));
  return {
    breakdown: data?.data ?? null,
    isLoading,
    isError: !!error,
  };
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
