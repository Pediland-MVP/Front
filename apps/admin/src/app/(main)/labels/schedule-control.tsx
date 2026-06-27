'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { onInputP2EHandler } from '@/lib/p2eNumber';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ScheduleType } from './types';

export interface ScheduleValue {
  scheduleType: ScheduleType;
  intervalMinutes?: number;
  dailyAtHour?: number;
}

const UNIT_FACTORS = { minutes: 1, hours: 60, days: 1440 } as const;
type Unit = keyof typeof UNIT_FACTORS;

function splitInterval(mins: number | undefined): { amount: number; unit: Unit } {
  const m = mins ?? 30;
  if (m % 1440 === 0) return { amount: m / 1440, unit: 'days' };
  if (m % 60 === 0) return { amount: m / 60, unit: 'hours' };
  return { amount: m, unit: 'minutes' };
}

export function ScheduleControl({
  value,
  onChange,
}: {
  value: ScheduleValue;
  onChange: (v: ScheduleValue) => void;
}) {
  const t = useTranslations('Labels');
  const { amount, unit } = splitInterval(value.intervalMinutes);

  const [amountStr, setAmountStr] = useState(String(amount));
  useEffect(() => {
    setAmountStr(String(amount));
  }, [amount]);

  const setInterval = (a: number, u: Unit) =>
    onChange({ scheduleType: 'interval', intervalMinutes: Math.max(1, a) * UNIT_FACTORS[u] });

  return (
    <div className="space-y-3" dir="rtl">
      <Label>{t('formSchedule')}</Label>
      <RadioGroup
        value={value.scheduleType}
        onValueChange={(v) =>
          v === 'interval'
            ? setInterval(amount, unit)
            : onChange({ scheduleType: 'daily', dailyAtHour: value.dailyAtHour ?? 20 })
        }
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="interval" id="sched-interval" />
          <Label htmlFor="sched-interval">{t('scheduleInterval')}</Label>
          {value.scheduleType === 'interval' && (
            <>
              <Input
                inputMode="numeric"
                onInput={onInputP2EHandler}
                min={1}
                className="w-20"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  const n = Number(e.target.value);
                  if (e.target.value !== '' && Number.isFinite(n) && n >= 1) setInterval(n, unit);
                }}
                onBlur={() => {
                  if (amountStr === '' || Number(amountStr) < 1) setAmountStr(String(amount));
                }}
              />
              <Select value={unit} onValueChange={(u) => setInterval(amount, u as Unit)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">{t('unitMinutes')}</SelectItem>
                  <SelectItem value="hours">{t('unitHours')}</SelectItem>
                  <SelectItem value="days">{t('unitDays')}</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="daily" id="sched-daily" />
          <Label htmlFor="sched-daily">{t('scheduleDaily')}</Label>
          {value.scheduleType === 'daily' && (
            <>
              <Input
                inputMode="numeric"
                onInput={onInputP2EHandler}
                min={0}
                max={23}
                className="w-20"
                value={value.dailyAtHour ?? 20}
                onChange={(e) =>
                  onChange({
                    scheduleType: 'daily',
                    dailyAtHour: Math.min(23, Math.max(0, Number(e.target.value))),
                  })
                }
              />
              <span>:00 {t('tehran')}</span>
            </>
          )}
        </div>
      </RadioGroup>
    </div>
  );
}
