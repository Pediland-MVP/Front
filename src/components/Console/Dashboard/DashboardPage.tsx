"use client";

import { StatsNamespace } from "@/types/stats";
import { useTranslations } from "next-intl";
import Link from "next/link";
import useSWRImmutable from "swr/immutable";

import { ItemsStatisticCard, LayoutPage, SubscriptionBoard } from "@components";

export const DashboardPage = () => {
  const {
    data: stats,
    error: statsError,
    isLoading: isStatsLoading,
  } = useSWRImmutable<StatsNamespace.Overall>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/stats/overall`,
  );

  const t = useTranslations("Console");

  type HomeItems = {
    title: string;
    total: number;
    icon: string;
    link: string;
  };

  const homeItems: HomeItems[] = [
    {
      title: "پیام خودکار",
      total: 18,
      icon: "Lightning",
      link: "/automations",
    },
    { title: "دایرکت", total: 5387, icon: "PaperPlaneTilt", link: "/directs" },
    { title: "کامنت", total: 11245, icon: "ChatCircle", link: "/comments" },
    { title: "کالا/خدمت", total: 8, icon: "Cube", link: "/products" },
    { title: "سفارش", total: 235, icon: "ShoppingBag", link: "/orders" },
    { title: "مخاطب", total: 1811, icon: "UserCircleCheck", link: "/contacts" },
  ];

  return (
    <LayoutPage>
      <div className="_dashboard-page space-y-4">
        <SubscriptionBoard />

        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {homeItems.map((item, i) => (
            <Link key={i} href={`${item.link}`}>
              <ItemsStatisticCard data={item} />
            </Link>
          ))}
        </div>
      </div>
    </LayoutPage>
  );
};
