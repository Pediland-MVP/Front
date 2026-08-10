// src/app/leads/dialog-new.tsx

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export default function DialogDelete({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations('DialogDelete');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-red-500">
            <WarningCircleIcon weight="duotone" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
          <DialogFooter>
            <Button
              type="button"
              color="destructive"
              onClick={() => {
                onConfirm();
              }}
            >
              {t('confirm')}
            </Button>
            <DialogClose asChild>
              <Button color="cancel">{t('cancel')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
