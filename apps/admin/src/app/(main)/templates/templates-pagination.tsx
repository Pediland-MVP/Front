'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface TemplatesPaginationProps {
  page: number;
  limit: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading?: boolean;
}

export function TemplatesPagination({
  page,
  limit,
  totalCount,
  onPageChange,
  onLimitChange,
  isLoading,
}: TemplatesPaginationProps) {
  const t = useTranslations('Pagination');
  const locale = useLocale();
  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, limit)));
  const showingFrom = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, totalCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="hidden items-center gap-2 md:flex">
        <Select
          dir={locale === 'fa' ? 'rtl' : 'ltr'}
          value={`${limit}`}
          onValueChange={(value) => onLimitChange(Number(value))}
          disabled={isLoading}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={limit} />
          </SelectTrigger>
          <SelectContent side="top">
            {[20, 40].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm font-medium">{t('pageSize')}</p>
      </div>

      <div className="flex w-full items-center justify-center md:w-auto">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            className="size-8"
            onClick={() => onPageChange(page + 1)}
            disabled={isLoading || page >= totalPages}
          >
            <span className="sr-only">Go to next page</span>
            {locale === 'fa' ? <ChevronLeft /> : <ChevronRight />}
          </Button>
          <Button
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={isLoading || page >= totalPages}
          >
            <span className="sr-only">Go to last page</span>
            {locale === 'fa' ? <ChevronsLeft /> : <ChevronsRight />}
          </Button>

          <div className="flex items-center justify-center px-4 text-sm font-medium">
            {t('pageIndicator', { pageIndex: page, totalPages })}
          </div>

          <Button
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={isLoading || page <= 1}
          >
            <span className="sr-only">{t('firstPage')}</span>
            {locale === 'fa' ? <ChevronsRight /> : <ChevronsLeft />}
          </Button>
          <Button
            size="icon"
            className="size-8"
            onClick={() => onPageChange(page - 1)}
            disabled={isLoading || page <= 1}
          >
            <span className="sr-only">{t('prevPage')}</span>
            {locale === 'fa' ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
      </div>

      <div className="hidden text-sm md:block md:pl-3">
        {t('showingItems', { from: showingFrom, to: showingTo, total: totalCount })}
      </div>
    </div>
  );
}
