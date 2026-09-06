'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FileDigitIcon, PackageIcon } from 'lucide-react';

import {
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';

interface ChooseProductKindDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Gate in front of `/products/add`: a seller picks physical or digital before the editor ever
 * mounts, because the choice decides the product's `kind` for the rest of its life (it can be
 * changed later too, but only until the first order line -- `COMMERCE_KIND_LOCKED`).
 */
export const ChooseProductKindDialog = ({ open, onOpenChange }: ChooseProductKindDialogProps) => {
  const t = useTranslations('Commerce.List.ChooseKind');
  const router = useRouter();

  const choose = (kind: 'physical' | 'digital') => {
    onOpenChange(false);
    router.push(`/products/add?kind=${kind}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Card
            role="button"
            tabIndex={0}
            onClick={() => choose('physical')}
            onKeyDown={(e) => e.key === 'Enter' && choose('physical')}
            className="hover:border-primary cursor-pointer text-center transition-colors"
          >
            <CardContent className="flex flex-col items-center gap-3 p-5">
              <PackageIcon className="size-10 text-gray-400" />
              <div className="font-bold">{t('physicalTitle')}</div>
              <p className="text-muted-foreground text-xs">{t('physicalDescription')}</p>
            </CardContent>
          </Card>
          <Card
            role="button"
            tabIndex={0}
            onClick={() => choose('digital')}
            onKeyDown={(e) => e.key === 'Enter' && choose('digital')}
            className="hover:border-primary cursor-pointer text-center transition-colors"
          >
            <CardContent className="flex flex-col items-center gap-3 p-5">
              <FileDigitIcon className="size-10 text-gray-400" />
              <div className="font-bold">{t('digitalTitle')}</div>
              <p className="text-muted-foreground text-xs">{t('digitalDescription')}</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
