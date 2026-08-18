import type React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FC } from 'react';
import { useLocale, useTranslations } from 'next-intl';

interface ProgressRadialProps {
  percentage: number;
  size: number;
  strokeWidth: number;
  id?: string;
  type?: 'percentage' | 'days' | 'credit' | 'automation';
  totalDays?: number;
  total?: number;
  label?: string;
}

export const ProgressRadial = ({
  percentage,
  size,
  strokeWidth,
  id = 'circular-progress-gradient',
  type = 'percentage',
  totalDays,
  total,
  label,
}: ProgressRadialProps) => {
  const locale = useLocale();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const t = useTranslations('Components.Progress');

  const totalValue = total ?? totalDays;

  const actualPercentage =
    (type === 'days' || type === 'automation') && totalValue
      ? (percentage / totalValue) * 100
      : percentage;

  const clampedPercentage = Math.min(100, Math.max(0, actualPercentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  // Free automation quota reached/exceeded (current count >= limit) — the ring turns red as a
  // warning. This is live, not the sticky `freeAutomationQuotaExceeded` flag: deleting an
  // automation back under the limit must turn the ring back to normal immediately.
  const isAutomationOverLimit = type === 'automation' && actualPercentage >= 100;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* پس‌زمینه خاکستری */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e6e6e6"
        strokeWidth={strokeWidth}
      />

      {/* تعریف گرادیانت */}
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" className="[stop-color:theme(colors.violet.600)]" />
          <stop offset="100%" className="[stop-color:theme(colors.blue.400)]" />
        </linearGradient>
      </defs>

      {/* دایره متحرک */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isAutomationOverLimit ? '#dc2626' : `url(#${id})`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={
          locale === 'fa'
            ? `rotate(-90 ${size / 2} ${size / 2})`
            : `rotate(90 ${size / 2} ${size / 2})`
        }
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />

      {type === 'automation' && !label ? (
        <>
          <motion.text
            x="50%"
            y="30%"
            textAnchor="middle"
            dy=".3em"
            fontSize="11"
            className={'fill-[theme(colors.gray.400)]'}
          >
            {t('automation_line1')}
          </motion.text>
          <motion.text
            x="50%"
            y="46%"
            textAnchor="middle"
            dy=".3em"
            fontSize="11"
            className={'fill-[theme(colors.gray.400)]'}
          >
            {t('automation_line2')}
          </motion.text>
          <motion.text
            x="50%"
            y="66%"
            textAnchor="middle"
            dy=".3em"
            fontSize="14"
            fontWeight="bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={cn(
              actualPercentage < 50
                ? 'fill-[theme(colors.blue.600)]'
                : 'fill-[theme(colors.violet.700)]',
            )}
          >
            {`${percentage} ${t('of')} ${totalValue ?? 2}`}
          </motion.text>
        </>
      ) : (
        <>
          <motion.text
            x="50%"
            y="39%"
            textAnchor="middle"
            dy=".3em"
            fontSize="12"
            className={'fill-[theme(colors.gray.400)]'}
          >
            {label ?? t('credit')}
          </motion.text>
          <motion.text
            x="50%"
            y="57%"
            textAnchor="middle"
            dy=".3em"
            fontSize="14"
            fontWeight="bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={cn(
              actualPercentage < 50
                ? 'fill-[theme(colors.blue.600)]'
                : 'fill-[theme(colors.violet.700)]',
              actualPercentage === 0 && type === 'days' && 'fill-[theme(colors.rose.500)]',
            )}
          >
            {type === 'days'
              ? `${percentage} ${t('days')}`
              : type === 'credit'
                ? `${percentage} ${t('message')}`
                : `${Math.round(actualPercentage)}%`}
          </motion.text>
        </>
      )}
    </svg>
  );
};
