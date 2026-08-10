'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CrownSimpleIcon } from '@phosphor-icons/react/dist/ssr/CrownSimple';

interface ContentPromotionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}
export const ContentPromotionDialog = ({ isOpen, setIsOpen }: ContentPromotionDialogProps) => {
  const t = useTranslations('Automations.ContentPromotionDialog');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-primary">
            <CrownSimpleIcon size={20} weight="duotone" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="default" asChild>
            <Link href="/settings/subscription?active=planSelection">{t('buttons.upgrade')}</Link>
          </Button>
          <DialogClose asChild>
            <Button variant="outline">{t('buttons.close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
