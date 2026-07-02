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
  type?: 'percentage' | 'days' | 'credit';
  totalDays?: number;
}

export const ProgressRadial = ({
  percentage,
  size,
  strokeWidth,
  id = 'circular-progress-gradient',
  type = 'percentage',
  totalDays,
}: ProgressRadialProps) => {
  const locale = useLocale();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const t = useTranslations('Components.Progress');

  const actualPercentage =
    type === 'days' && totalDays ? (percentage / totalDays) * 100 : percentage;

  const strokeDashoffset = circumference - (actualPercentage / 100) * circumference;

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
        stroke={`url(#${id})`}
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

      <motion.text
        x="50%"
        y="39%"
        textAnchor="middle"
        dy=".3em"
        fontSize="12"
        className={'fill-[theme(colors.gray.400)]'}
      >
        {t('credit')}
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
          actualPercentage === 0 && 'fill-[theme(colors.rose.500)]',
        )}
      >
        {type === 'days'
          ? `${percentage} ${t('days')}`
          : type === 'credit'
            ? `${percentage} ${t('message')}`
            : `${Math.round(actualPercentage)}%`}
      </motion.text>
    </svg>
  );
};
