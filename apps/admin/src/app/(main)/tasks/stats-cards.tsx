"use client";

import React from "react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TasksStats } from "@/types/task";

type StatCardConfig = {
  key: keyof TasksStats;
  accent: string;
  iconBg: string;
};

const STAT_CARDS: StatCardConfig[] = [
  {
    key: "today",
    accent: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  },
  {
    key: "expired",
    accent: "border-rose-200 dark:border-rose-800",
    iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  },
  {
    key: "doneToday",
    accent: "border-emerald-200 dark:border-emerald-800",
    iconBg:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  },
  {
    key: "thisWeek",
    accent: "border-indigo-200 dark:border-indigo-800",
    iconBg:
      "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  },
];

export function TasksStatsCards(props: {
  stats?: TasksStats;
  isLoading?: boolean;
}): React.JSX.Element {
  const { stats, isLoading } = props;
  const t = useTranslations("Tasks");

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <Card key={card.key} className={cn("border", card.accent)}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STAT_CARDS.map((card) => (
        <Card key={card.key} className={cn("border", card.accent)}>
          <CardHeader>
            <CardTitle>
              <span className={cn("rounded-md px-2 py-1 text-xs font-medium", card.iconBg)}>
                {t(`stats.${card.key}`)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {stats?.[card.key] ?? 0}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
