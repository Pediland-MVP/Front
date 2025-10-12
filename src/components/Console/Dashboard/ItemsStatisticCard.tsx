"use client";

import * as PhosphorIcons from "@phosphor-icons/react";
import { CardSimple } from "@components";

interface ItemsStatisticCardProps {
  data: {
    title: string;
    total: number | React.ReactNode;
    icon: string;
  };
}

export const ItemsStatisticCard = ({ data }: ItemsStatisticCardProps) => {
  const Icon = (PhosphorIcons as any)[data?.icon];

  return (
    <CardSimple className="p-3">
      <div className="flex aspect-square flex-col items-center justify-center gap-2 md:gap-3">
        {Icon ? (
          <Icon
            weight="duotone"
            className="mx-auto size-6 text-violet-500 md:size-8"
          />
        ) : (
          <div className="text-xs text-gray-400">...</div>
        )}
        <h2 className="text-muted-foreground text-[13px] font-medium md:text-sm">
          {data?.title}
        </h2>
        <div className="text-secondary/90 pt-1 text-xl leading-[14px] font-bold">
          {typeof data?.total === 'number' ? data.total.toLocaleString("fa-IR") : data?.total || ""}
        </div>
      </div>
    </CardSimple>
  );
};
