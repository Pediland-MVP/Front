'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { METRICS } from './metrics.constants';

interface MetricMultiSelectProps {
  selected: number[];
  onToggle: (type: number) => void;
}

/** Toggle chips for the 5 metrics. At least one stays selected (enforced upstream). */
export function MetricMultiSelect({ selected, onToggle }: MetricMultiSelectProps) {
  const t = useTranslations('Dashboard');
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">{t('metricsLabel')}:</span>
      {METRICS.map((m) => {
        const isOn = selected.includes(m.type);
        return (
          <Button
            key={m.type}
            size="sm"
            variant={isOn ? 'default' : 'outline'}
            onClick={() => onToggle(m.type)}
            aria-pressed={isOn}
          >
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: m.color }}
            />
            {t(m.key)}
            {isOn && <Check className="size-3" />}
          </Button>
        );
      })}
    </div>
  );
}
