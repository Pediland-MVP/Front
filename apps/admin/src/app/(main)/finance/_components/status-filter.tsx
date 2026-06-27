'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { InvoiceStatusEnum } from '@/types/finance';
import { INVOICE_STATUSES, invoiceStatusLabels } from '@/constants/invoice-status';

interface StatusFilterProps {
  /** Selected statuses. Empty array means "all statuses". */
  value: InvoiceStatusEnum[];
  onChange: (value: InvoiceStatusEnum[]) => void;
}

/** Multi-select status chips driving both the chart and the payments table. */
export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const t = useTranslations('Finance');

  const toggle = (status: InvoiceStatusEnum) => {
    onChange(value.includes(status) ? value.filter((s) => s !== status) : [...value, status]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">{t('statusLabel')}:</span>
      <Button
        size="sm"
        variant={value.length === 0 ? 'default' : 'outline'}
        onClick={() => onChange([])}
      >
        {t('allStatuses')}
      </Button>
      {INVOICE_STATUSES.map((status) => (
        <Button
          key={status}
          size="sm"
          variant={value.includes(status) ? 'default' : 'outline'}
          onClick={() => toggle(status)}
        >
          {invoiceStatusLabels[status]}
        </Button>
      ))}
    </div>
  );
}
