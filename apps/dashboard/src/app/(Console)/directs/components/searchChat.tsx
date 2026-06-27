'use client';

import React from 'react';
import { FC } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';

const SearchChat: FC = () => {
  const t = useTranslations('General.search');
  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 p-4 backdrop-blur">
      <form>
        <div className="relative">
          <MagnifyingGlass className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
          <Input placeholder={t('search')} className="pl-8" />
        </div>
      </form>
    </div>
  );
};

export default SearchChat;
