"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import useSWRImmutable from "swr/immutable";

// TODO: Should Refactor
import { OverallStats } from "@/types/stats";

import { ItemsStatisticCard, LoaderPulse } from "@components";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

interface HomeItems {
  title: string;
  total: number | React.ReactNode;
  icon: string;
  link: string;
}

export const DashboardStats = () => {
  const t = useTranslations("Console.Dashboard");

  const {
    data: stats,
    error: statsError,
    isLoading: isStatsLoading,
  } = useSWRImmutable<OverallStats>(`${API_URL}/stats/overall`);

  const rlsPriceFormat = (price: number) => {
    if (!price) return "0";

    const million = price / 1000000;
    return (
      <>
        {million.toLocaleString("fa-IR")}{" "}
        <span className="flex text-sm font-medium">{t("million")}</span>
      </>
    );
  };

  console.log("Stats", stats);

  const homeItems: HomeItems[] = [
    {
      title: t("automation"),
      total: isStatsLoading ? <LoaderPulse /> : stats?.contentCycles?.count,
      icon: "Lightning",
      link: "/automations",
    },
    {
      title: t("sessions"),
      total: isStatsLoading ? <LoaderPulse /> : stats?.sessions?.count,
      icon: "ChatDots",
      link: "/automations/sessions",
    },
    {
      title: t("leads"),
      total: isStatsLoading ? <LoaderPulse /> : stats?.leads?.count,
      icon: "UserCircleCheck",
      link: "/contacts",
    },
    {
      title: t("products"),
      total: isStatsLoading ? <LoaderPulse /> : stats?.products?.count,
      icon: "Cube",
      link: "/products",
    },
    {
      title: t("orders"),
      total: isStatsLoading ? <LoaderPulse /> : stats?.sales?.count,
      icon: "ShoppingBag",
      link: "/orders",
    },
    {
      title: t("sales"),
      total: isStatsLoading ? (
        <LoaderPulse />
      ) : (
        rlsPriceFormat(stats?.sales?.total)
      ),
      icon: "Coins",
      link: "/comments",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
      {homeItems.map((item, i) => (
        <Link key={i} href={`${item.link}`}>
          <ItemsStatisticCard data={item} />
        </Link>
      ))}
    </div>
  );
};
