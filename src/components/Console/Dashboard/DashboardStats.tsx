"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import useSWRImmutable from "swr/immutable";

// TODO: Should Refactor
import { OverallStats } from "@/types/stats";

import {
  CardContent,
  CardSimple,
  ItemsStatisticCard,
  LoaderPulse,
} from "@components";
import { PlusCircleIcon } from "@phosphor-icons/react";

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

  console.log("Stats....", stats);

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

  const homeItems: HomeItems[] = [
    {
      title: t("automation"),
      total: isStatsLoading ? <LoaderPulse /> : stats?.contentCycles?.count,
      icon: "Lightning",
      link: "/automations",
    },
    // {
    //   title: t("sessions"),
    //   total: isStatsLoading ? <LoaderPulse /> : stats?.sessions?.count,
    //   icon: "ChatDots",
    //   link: "/automations/sessions",
    // },
    {
      title: t("leads"),
      total: isStatsLoading ? <LoaderPulse /> : stats?.leads?.count,
      icon: "AddressBook",
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
      link: "/orders",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
      <Link href="/automations/add">
        <CardSimple className="group h-full border-blue-200 bg-blue-50/50 duration-300">
          <CardContent className="flex flex-1 flex-col items-center justify-center gap-1 p-3 pb-2 md:py-4">
            <PlusCircleIcon
              weight="duotone"
              className="text-secondary mx-auto size-6 md:size-8"
            />
            <div className="text-secondary/90 p-1 text-center text-sm leading-relaxed font-semibold">
              افزودن
              <br />
              پیام خودکار
            </div>
          </CardContent>
        </CardSimple>
      </Link>

      {homeItems.map((item, i) => (
        <Link key={i} href={`${item.link}`}>
          <ItemsStatisticCard data={item} />
        </Link>
      ))}
    </div>
  );
};
