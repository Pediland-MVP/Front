import { useTranslations } from 'next-intl';
import type { LabelListItem } from './types';

type TFn = ReturnType<typeof useTranslations<'Labels'>>;

export function scheduleSummary(
  item: Pick<LabelListItem, 'scheduleType' | 'intervalMinutes' | 'dailyAtHour'>,
  t: TFn,
): string {
  if (item.scheduleType === 'daily') {
    const h = String(item.dailyAtHour ?? 0).padStart(2, '0');
    return `${t('scheduleDaily')} ${h}:00 ${t('tehran')}`;
  }
  const mins = item.intervalMinutes ?? 0;
  if (mins > 0 && mins % 1440 === 0) return `${mins / 1440} ${t('unitDays')}`;
  if (mins > 0 && mins % 60 === 0) return `${mins / 60} ${t('unitHours')}`;
  return `${mins} ${t('unitMinutes')}`;
}
