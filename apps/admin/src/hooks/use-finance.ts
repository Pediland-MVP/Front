import useSWR from "swr";
import type {
  FinanceSummary,
  InvoiceStatusEnum,
  RevenueSeries,
} from "@/types/finance";
import type { RangeConfig } from "@/app/(main)/_components/metrics.constants";

// Responses are ResponseMessage-wrapped (CLAUDE.md §8); the SWR fetcher returns
// the axios body, so the payload lives under `.data`.
interface Wrapped<T> {
  data: T;
}

/** Converts a RangeConfig into a concrete [from, to) ISO window. */
export function rangeToWindow(range: RangeConfig): { from: string; to: string } {
  if (range.mode === "custom") {
    return { from: range.from, to: range.to };
  }
  const to = new Date();
  const from = new Date(to.getTime() - range.days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function windowParams(window: { from: string; to: string }): URLSearchParams {
  return new URLSearchParams({ from: window.from, to: window.to });
}

export function useRevenueSeries(
  window: { from: string; to: string },
  statuses: InvoiceStatusEnum[],
) {
  const params = windowParams(window);
  if (statuses.length) params.set("statuses", statuses.join(","));

  const { data, error, isLoading, isValidating } = useSWR<Wrapped<RevenueSeries>>(
    `/finance/revenue-series?${params.toString()}`,
  );

  return {
    series: data?.data ?? null,
    isLoading,
    isValidating,
    isError: !!error,
  };
}

export function useFinanceSummary(window: { from: string; to: string }) {
  const { data, error, isLoading } = useSWR<Wrapped<FinanceSummary>>(
    `/finance/summary?${windowParams(window).toString()}`,
  );

  return {
    summary: data?.data ?? null,
    isLoading,
    isError: !!error,
  };
}
