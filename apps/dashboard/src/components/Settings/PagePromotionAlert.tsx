'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { MegaphoneSimpleIcon } from '@phosphor-icons/react/dist/ssr/MegaphoneSimple';
import { SparkleIcon } from '@phosphor-icons/react/dist/ssr/Sparkle';
import { Button } from '@/components/ui/button';

interface PagePromotionAlertProps {
  instagramId: string;
}

export function PagePromotionAlert({ instagramId }: PagePromotionAlertProps) {
  const t = useTranslations('Settings.Accounts');
  const router = useRouter();

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50/50 p-3">
      <div className="flex items-start gap-2.5">
        <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
          <MegaphoneSimpleIcon size={18} weight="duotone" />
        </div>
        <p className="pt-0.5 text-[11.5px] leading-5 text-violet-950/75">
          {t('page_promotion_alert')}
        </p>
      </div>

      <Button
        size="sm"
        className="mt-2.5 h-9 w-full gap-1.5 shadow-sm shadow-violet-500/20"
        onClick={() => router.push(`/settings/subscription?instagramId=${instagramId}`)}
      >
        <SparkleIcon size={16} weight="fill" />
        {t('page_promotion_cta')}
      </Button>
    </div>
  );
}
