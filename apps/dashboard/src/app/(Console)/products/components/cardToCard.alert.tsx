'use client';

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CardToCardAlert() {
  const t = useTranslations('Products.List.Alert');

  return (
    <div className="absolute top-1/2 left-1/2 mx-auto flex w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform flex-col items-center justify-center space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('title')}</AlertTitle>
        <AlertDescription>{t('description')}</AlertDescription>
        <div className="flex w-full items-center justify-center gap-x-2">
          <Link href={'/settings/card'}>
            <Button className="mt-5 w-full">{t('cardToCard')}</Button>
          </Link>
          <Link href={'/settings/zarinpal'}>
            <Button className="mt-5 w-full">{t('zarinpal')}</Button>
          </Link>
        </div>
      </Alert>
    </div>
  );
}
