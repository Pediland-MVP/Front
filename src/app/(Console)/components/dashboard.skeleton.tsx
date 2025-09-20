"use client";
import { useTranslations } from "next-intl";
// UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from "@/components/ui/breadcrumb";
import SidebarTrigger from "@/components/ui/sidebar";
import Link from "next/link";

export default function DashboardSkeleton({ accessDenied = false }) {
  const t = useTranslations("Console");

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <img src="/images/emojies/emj-01.webp" alt="404" width={120} height={120} />
        <h2 className="text-xl font-semibold text-red-600 mt-3 mb-1">{t("accessDenied")}</h2>
        <p className="text-muted-foreground"><Link href="/settings/instagram" className="text-blue-600 underline underline-offset-8 hover:text-primary">{t("accessNote")}</Link></p>
      </div>
    );
  }

  return (
    <div className="_dashboard">
      <header className="bg-white px-4 py-3 h-16 flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 border-b-2 border-gray-100">
        <div className="_wrap flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="bg-gray-200 w-24 h-4 rounded-md animate-pulse"></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="_tools"></div>
      </header>

      <div className="_wrapper">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="border-l-2 border-gray-100 animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="bg-gray-200 w-32 h-6 rounded-md"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-200 w-16 h-8 rounded-md mb-2"></div>
                <div className="bg-gray-200 w-24 h-4 rounded-md"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid col-span-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mt-4">
          <Card className="col-span-1 lg:col-span-4 border-l-2 border-y-2 border-gray-100 animate-pulse">
            <CardHeader>
              <CardTitle className="bg-gray-200 w-48 h-6 rounded-md"></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-200 w-full h-64 rounded-md"></div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-3 border-y-2 border-gray-100 animate-pulse">
            <CardHeader>
              <CardTitle className="bg-gray-200 w-48 h-6 rounded-md"></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="bg-gray-200 h-9 w-9 rounded-full"></div>
                    <div className="flex flex-col space-y-2 w-full">
                      <div className="bg-gray-200 w-32 h-4 rounded-md"></div>
                      <div className="bg-gray-200 w-48 h-4 rounded-md"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
