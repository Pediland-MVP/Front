"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, FileText, TrendingUp } from "lucide-react";
import useSWRImmutable from "swr/immutable";
import { fetcher } from "@/hooks/swr/fetcher";
import { StatsNamespace } from "@/types/stats";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import moment from "moment-jalaali";
import DashboardSkeleton from "./components/dashboard.skeleton";
import LeadsGrowsChart from "./components/leadsGrows.chart";

export default function Dashboard() {
  const {
    data: stats,
    error: statsError,
    isLoading: isStatsLoading,
  } = useSWRImmutable<StatsNamespace.Overall>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/stats/overall`,
    fetcher
  );

  if (isStatsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="_dashboard space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد محصولات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.products.count}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.products.growth}% از ماه پیش
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد مخاطب</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.leads.count}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.leads.growth}% از ماه پیش
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">اتومیشن‌ها</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.contentCycles.count}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد جواب‌ها</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sessions.count}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.sessions.growth}% از ماه پیش
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>رشد تعداد مخاطبین</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <LeadsGrowsChart stats={stats} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>سشن‌های اخیر</CardTitle>
            <CardContent>
              <div className="space-y-2 mt-9">
                {stats?.recentSessions.map((session) => (
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
                      <p className="text-sm font-medium leading-none">
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
                ))}
              </div>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
      {/* </TabsContent> */}
      {/* </Tabs> */}
    </div>
  );
}
