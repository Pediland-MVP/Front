'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';

interface FreeQuotaWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  usedCount: number;
  limit: number;
  instagramId: string;
}

export const FreeQuotaWarningDialog = ({
  isOpen,
  onClose,
  onConfirm,
  usedCount,
  limit,
  instagramId,
}: FreeQuotaWarningDialogProps) => {
  const t = useTranslations('Automations.FreeQuotaWarningDialog');
  const router = useRouter();
  const percent = limit > 0 ? Math.min(100, (usedCount / limit) * 100) : 100;

  const handleBuySubscription = () => {
    onClose();
    router.push(`/settings/subscription?instagramId=${instagramId}`);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive flex items-center gap-1">
            <WarningCircleIcon size={24} weight="duotone" />
            {t('title')}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          <Progress value={percent} />
          <span className="text-muted-foreground text-sm">
            {t('usageLabel', { used: usedCount, limit })}
          </span>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction onClick={onConfirm}>{t('buttons.continueWithAds')}</AlertDialogAction>
          <AlertDialogCancel onClick={handleBuySubscription}>
            {t('buttons.buySubscription')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
