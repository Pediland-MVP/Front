import type { SeriesResolution } from '@/hooks/use-platform-metrics';

/** Formats a bucket ISO timestamp for an axis tick, by resolution. */
export function formatBucket(iso: string, resolution: SeriesResolution | undefined): string {
  const d = new Date(iso);
  if (resolution === '1h') {
    return new Intl.DateTimeFormat('fa-IR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
    }).format(d);
  }
  return new Intl.DateTimeFormat('fa-IR', {
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}
