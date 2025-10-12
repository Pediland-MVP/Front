"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import useSWRImmutable from "swr/immutable";

// TODO: Should Refactor
import { StatsNamespace } from "@/types/stats";

import { ItemsStatisticCard, LoaderPulse } from "@components";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

type HomeItems = {
  title: string;
  total: number | React.ReactNode;
  icon: string;
  link: string;
};

export const DashboardStats = () => {
  const t = useTranslations("Console");

  const {
    data: stats,
    error: statsError,
    isLoading: isStatsLoading,
  } = useSWRImmutable<StatsNamespace.Overall>(`${API_URL}/stats/overall`);

  const homeItems: HomeItems[] = [
    {
      title: "پیام خودکار",
      total: isStatsLoading ? <LoaderPulse /> : stats?.contentCycles?.count,
      icon: "Lightning",
      link: "/automations",
    },
    {
      title: "دایرکت",
      total: isStatsLoading ? <LoaderPulse /> : 0,
      icon: "PaperPlaneTilt",
      link: "/directs",
    },
    {
      title: "کامنت",
      total: isStatsLoading ? <LoaderPulse /> : 0,
      icon: "ChatCircle",
      link: "/comments",
    },
    {
      title: "کالا/خدمت",
      total: isStatsLoading ? <LoaderPulse /> : stats?.products?.count,
      icon: "Cube",
      link: "/products",
    },
    {
      title: "سفارش",
      total: isStatsLoading ? <LoaderPulse /> : 0,
      icon: "ShoppingBag",
      link: "/orders",
    },
    {
      title: "مخاطب",
      total: isStatsLoading ? <LoaderPulse /> : stats?.leads?.count,
      icon: "UserCircleCheck",
      link: "/contacts",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
      {homeItems.map((item, i) => (
        <Link key={i} href={`${item.link}`}>
          <ItemsStatisticCard data={item} />
        </Link>
      ))}
    </div>
  );
};
