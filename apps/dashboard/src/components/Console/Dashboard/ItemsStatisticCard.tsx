'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useLinkStatus } from 'next/link';

import { CircleNotchIcon } from '@phosphor-icons/react/dist/csr/CircleNotch';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react/dist/lib/types';

import { CardSimple } from '@/components/ui-custom/CardSimple';
import { CardContent, CardFooter } from '@/components/ui/card';

interface ItemsStatisticCardProps {
  data: {
    title: string;
    total: number | React.ReactNode;
    // The icon component itself, not its name. Resolving a name at runtime
    // needs `import * as PhosphorIcons`, which drags Phosphor's whole
    // ~3025-module barrel into the dashboard route.
    icon: PhosphorIcon;
  };
}

export const ItemsStatisticCard = ({ data }: ItemsStatisticCardProps) => {
  const t = useTranslations('Console.Dashboard');
  const locale = useLocale();
  const { pending } = useLinkStatus();
  const Icon = data?.icon;

  return (
    <CardSimple className="group duration-300 md:hover:border-blue-200 md:hover:bg-blue-50/50">
      <CardContent className="p-3 pb-2 md:py-4">
        <div className="flex flex-col items-center justify-center gap-2 md:gap-3">
          {pending ? (
            <CircleNotchIcon
              weight="duotone"
              className="mx-auto size-6 animate-spin text-violet-500 md:size-8"
            />
          ) : Icon ? (
            <Icon weight="duotone" className="mx-auto size-6 text-violet-500 md:size-8" />
          ) : (
            <div className="text-xs text-gray-400">...</div>
          )}

          <div className="mt-1 flex flex-col items-center justify-center">
            <div className="text-secondary/90 flex items-center gap-1 text-xl leading-none font-bold">
              {typeof data?.total === 'number'
                ? locale === 'fa'
                  ? data.total.toLocaleString('fa-IR')
                  : data.total
                : data?.total || ''}
            </div>
            <h2 className="text-muted-foreground text-[13px] font-medium md:text-sm">
              {data?.title}
            </h2>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-muted-foreground md:group-hover:text-secondary justify-center rounded-b-xl! bg-gray-50 p-1.5 text-[11px] font-medium duration-300 md:group-hover:bg-blue-100/50">
        {t('details')}
      </CardFooter>
    </CardSimple>
  );
};
