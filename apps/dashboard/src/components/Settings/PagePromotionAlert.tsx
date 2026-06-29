'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

interface PagePromotionAlertProps {
  instagramId: string;
}

export function PagePromotionAlert({ instagramId }: PagePromotionAlertProps) {
  const t = useTranslations('Settings.Accounts');
  const router = useRouter();

  return (
    <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
      <p>{t('page_promotion_alert')}</p>
      <Button
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={() => router.push(`/settings/subscription?instagramId=${instagramId}`)}
      >
        {t('page_promotion_cta')}
      </Button>
    </div>
  );
}
