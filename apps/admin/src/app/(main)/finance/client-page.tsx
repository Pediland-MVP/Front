// src/app/(main)/finance/client-page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';

import { useAuth } from '@/hooks/use-auth';
import { rangeToWindow, useFinanceSummary, useRevenueSeries } from '@/hooks/use-finance';
import type { RangeConfig } from '@/app/(main)/_components/metrics.constants';
import { InvoiceStatusEnum, type PaymentsResponse } from '@/types/finance';

import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import { RangeControl } from '@/app/(main)/_components/range-control';
import { StatusFilter } from './_components/status-filter';
import { SummaryCards } from './_components/summary-cards';
import { RevenueChart } from './_components/revenue-chart';
import { PaymentsTable } from './payments-table';
import { LayoutTable } from '@/components/layout/LayoutTable';

export default function FinancePageClient() {
  const t = useTranslations('Finance');
  const { user, isLoading: isAuthLoading } = useAuth();

  const [range, setRange] = useState<RangeConfig>({ mode: 'preset', days: 30 });
  const [statuses, setStatuses] = useState<InvoiceStatusEnum[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 750);

  const window = useMemo(() => rangeToWindow(range), [range]);

  const { summary, isLoading: summaryLoading } = useFinanceSummary(window);
  const {
    series,
    isLoading: seriesLoading,
    isValidating: seriesValidating,
  } = useRevenueSeries(window, statuses);

  // Payments table fetch — shares the range + status filters with the chart.
  const paymentsKey = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      // ReadPaymentsDto reads `startDate`/`endDate` (not `from`/`to`).
      startDate: window.from,
      endDate: window.to,
    });
    if (statuses.length) params.set('statuses', statuses.join(','));
    if (debouncedSearch) params.set('search', debouncedSearch);
    return `/finance/payments?${params.toString()}`;
  }, [page, limit, window, statuses, debouncedSearch]);

  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = useSWR<PaymentsResponse>(paymentsKey, { keepPreviousData: true });

  // Any filter change resets pagination to the first page.
  useEffect(() => {
    setPage(1);
  }, [window, statuses, debouncedSearch]);

  if (isAuthLoading) return <Loading />;
  if (user && user.role !== 'admin') {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center py-20 text-sm">
        {t('forbidden')}
      </div>
    );
  }

  const payments = paymentsData?.items ?? [];
  const meta = paymentsData?.meta ?? {
    currentPage: page,
    itemCount: 0,
    itemsPerPage: limit,
    totalItems: 0,
    totalPages: 0,
  };

  return (
    <LayoutTable>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">{t('title')}</h1>

        <div className="flex flex-col gap-3">
          <RangeControl value={range} onChange={setRange} />
          <StatusFilter value={statuses} onChange={setStatuses} />
        </div>

        <SummaryCards summary={summary} isLoading={summaryLoading} />

        <RevenueChart
          points={series?.points ?? []}
          resolution={series?.resolution}
          statuses={statuses}
          isLoading={seriesLoading || seriesValidating}
        />

        {paymentsError ? (
          <FetchError />
        ) : paymentsLoading && !paymentsData ? (
          <Loading />
        ) : (
          <PaymentsTable
            payments={payments}
            meta={meta}
            onPageChange={setPage}
            onLimitChange={setLimit}
            search={search}
            onSearchChange={setSearch}
          />
        )}
      </div>
    </LayoutTable>
  );
}
