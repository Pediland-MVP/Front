'use client'

import React from "react";
import { FC } from "react";
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Input } from '@befroosh/ui';
import { useTranslations } from "next-intl";


const SearchChat: FC = () => {
    const t = useTranslations('General.search');
    return (
        <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form>
          <div className="relative">
            <MagnifyingGlass className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('search')} className="pl-8" />
          </div>
        </form>
      </div>
    )
}

export default SearchChat