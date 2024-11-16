"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Users, FileText, TrendingUp } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"

export default function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">داشبرد</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "تعداد محصولات", icon: Package },
          { title: "تعداد مخاطب", icon: Users },
          { title: "اتومیشن‌ها", icon: FileText },
          { title: "تعداد جواب‌ها", icon: TrendingUp },
        ].map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-20" />
              <Skeleton className="mt-2 h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>رشد تعداد مخاطبین</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>سشن‌های اخیر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mt-9">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center border rounded-lg p-5">
                  <Avatar>
                    <Skeleton className="h-9 w-9 rounded-full" />
                  </Avatar>
                  <div className="mr-4 space-y-1 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}