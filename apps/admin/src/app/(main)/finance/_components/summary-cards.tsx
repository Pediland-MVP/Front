'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { FinanceSummary } from '@/types/finance';

interface SummaryCardsProps {
  summary: FinanceSummary | null;
  isLoading: boolean;
}

const nf = new Intl.NumberFormat('fa-IR');

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  const t = useTranslations('Finance');

  const cards: { key: string; value: string; accent: string }[] = summary
    ? [
        {
          key: 'collectedRevenue',
          value: `${nf.format(summary.collectedRevenue)} ${t('toman')}`,
          accent: 'text-green-600',
        },
        {
          key: 'successCount',
          value: nf.format(summary.successCount),
          accent: 'text-foreground',
        },
        {
          key: 'nonSuccessAmount',
          value: `${nf.format(summary.nonSuccessAmount)} ${t('toman')}`,
          accent: 'text-red-600',
        },
        {
          key: 'successRate',
          value: `${nf.format(summary.successRate)}٪`,
          accent: 'text-foreground',
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {(isLoading || !summary
        ? ['collectedRevenue', 'successCount', 'nonSuccessAmount', 'successRate']
        : cards.map((c) => c.key)
      ).map((key) => {
        const card = cards.find((c) => c.key === key);
        return (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardDescription>{t(`cards.${key}`)}</CardDescription>
              <CardTitle className={`text-2xl tabular-nums ${card?.accent ?? ''}`}>
                {isLoading || !card ? <Skeleton className="h-7 w-28" /> : card.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-xs">
              {t(`cardsHint.${key}`)}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
