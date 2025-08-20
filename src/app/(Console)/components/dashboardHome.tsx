"use client";

import useSWRImmutable from "swr/immutable";
import { fetcher } from "@/hooks/swr/fetcher";
import { StatsNamespace } from "@/types/stats";
import moment from "moment-jalaali";
import LeadsGrowsChart from "./leadsGrows.chart";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ChatDots,
  Package,
  Robot,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

export default function DashboardHome() {
  const {
    data: stats,
    error: statsError,
    isLoading: isStatsLoading,
  } = useSWRImmutable<StatsNamespace.Overall>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/stats/overall`,
  );

  const t = useTranslations("Console");

  return (
    <div className="_dashboard h-full">
      <div className="_wrapper min-h-[calc(100vh-5.5rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-4">
          <Card className="border-l-2 border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="tracking-normal">
                {t("productCount")}
              </CardTitle>
              <Package size={40} weight="light" className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.products.count.toLocaleString("fa-IR")}
              </div>
              <p className="text-muted-foreground text-sm">
                {t("growthFromLastMonth", {
                  growth: stats?.products.growth.toLocaleString("fa-IR"),
                })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-2 border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="tracking-normal">
                {t("leadCount")}
              </CardTitle>
              <Users size={40} weight="light" className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.leads.count.toLocaleString("fa-IR")}
              </div>
              <p className="text-muted-foreground text-sm">
                {t("growthFromLastMonth", {
                  growth: stats?.leads.growth.toLocaleString("fa-IR"),
                })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-2 border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="tracking-normal">
                {t("automations")}
              </CardTitle>
              <Robot size={40} weight="light" className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.contentCycles.count.toLocaleString("fa-IR")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="tracking-normal">
                {t("responseCount")}
              </CardTitle>
              <ChatDots size={40} weight="light" className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.sessions.count.toLocaleString("fa-IR")}
              </div>
              <p className="text-muted-foreground text-sm">
                {t("growthFromLastMonth", {
                  growth: stats?.sessions.growth.toLocaleString("fa-IR"),
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1 grid h-full bg-red-500 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 border-y-2 border-l-2 border-gray-100 lg:col-span-4">
            <CardHeader>
              <CardTitle className="tracking-normal">
                {t("leadsGrowthChart")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeadsGrowsChart eachMonthLeadGrow={stats?.eachMonthLeadGrows} />
            </CardContent>
          </Card>

          <Card className="col-span-1 border-y-2 border-gray-100 lg:col-span-3">
            <CardHeader>
              <CardTitle className="tracking-normal">
                {t("recentSessions")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-full flex-col">
                {stats?.recentSessions?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center">
                    <Image
                      alt="man shrugging"
                      src={"/images/emojies/man-shrugging.webp"}
                      width={100}
                      height={100}
                    />
                    <p className="text-muted-foreground">
                      {t("noRecentSessions")}
                    </p>
                  </div>
                ) : (
                  stats?.recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center border-b p-4 first:border-t"
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
                        <p className="leading-none font-medium">
                          {session.leadInstagram?.name}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {session.leadInstagram.username} •{" "}
                          {session.contentCycle.title}
                        </p>
                      </div>
                      <div className="text-muted-foreground mr-auto text-sm">
                        {moment(session.updateDate).format(
                          "HH:MM  jYYYY/jMM/jDD",
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
