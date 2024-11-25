"use client";

import useSWRImmutable from "swr/immutable";
import { fetcher } from "@/hooks/swr/fetcher";
import { StatsNamespace } from "@/types/stats";
import moment from "moment-jalaali";
import DashboardSkeleton from "./components/dashboard.skeleton";
import LeadsGrowsChart from "./components/leadsGrows.chart";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import SidebarTrigger from "@/components/theme/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList
} from "@/components/theme/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/theme/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ChatDots,
  Package,
  Robot,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

export default function Dashboard() {
  const {
    data: stats,
    error: statsError,
    isLoading: isStatsLoading,
  } = useSWRImmutable<StatsNamespace.Overall>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/stats/overall`,
    fetcher
  );

  const t = useTranslations("Console");

  if (isStatsLoading) {
    return <DashboardSkeleton />;
  }

  if (statsError) {
    const data = statsError?.data;
    if (data?.code === 6) {
      return <DashboardSkeleton accessDenied={true} />;
    }
  }

  return (
    <div className="_dashboard">
      <header className="px-4 pt-4 flex justify-between items-center gap-4">
        <div className="_wrap flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>{t("dashboard")}</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="_tools"></div>
      </header>

      <div className="p-4 space-y-4">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium">{t("productCount")}</CardTitle>
              <Package
                size={40}
                weight="light"
                className="text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.products.count}</div>
              <p className="text-sm text-muted-foreground">
                {t("growthFromLastMonth", { growth: stats?.products.growth })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium">{t("leadCount")}</CardTitle>
              <Users
                size={40}
                weight="light"
                className="text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.leads.count}</div>
              <p className="text-sm text-muted-foreground">
                {t("growthFromLastMonth", { growth: stats?.leads.growth })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium">{t("automations")}</CardTitle>
              <Robot
                size={40}
                weight="light"
                className="text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.contentCycles.count}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium">
                {t("responseCount")}
              </CardTitle>
              <ChatDots
                size={40}
                weight="light"
                className="text-muted-foreground"
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.sessions.count}</div>
              <p className="text-sm text-muted-foreground">
                {t("growthFromLastMonth", { growth: stats?.sessions.growth })}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 col-span-1 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle>{t("leadsGrowthChart")}</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadsGrowsChart eachMonthLeadGrow={stats?.eachMonthLeadGrows} />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>{t("recentSessions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mt-9 h-full flex flex-col justify-center items-center">
                {
                  stats?.recentSessions?.length === 0 ?
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <Image alt="man shrugging" src={'/images/emojies/man-shrugging.webp'} width={200} height={200} />
                      <p className="text-muted-foreground text-xl">{t("noRecentSessions")}</p>
                    </div>
                    : 
                stats?.recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center border rounded-lg p-5 cursor-pointer"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={session.leadInstagram.profilePicture?.url}
                        alt={session.leadInstagram?.name}
                      />
                      <AvatarFallback>
                        {session.leadInstagram.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="mr-4 space-y-1">
                      <p className="font-medium leading-none">
                        {session.leadInstagram?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.leadInstagram.username} •{" "}
                        {session.contentCycle.title}
                      </p>
                    </div>
                    <div className="mr-auto text-sm text-muted-foreground">
                      {moment(session.updateDate).format(
                        "HH:MM  jYYYY/jMM/jDD"
                      )}
                    </div>
                  </div>
                ))
              }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
