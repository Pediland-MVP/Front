'use client';
import { useTranslations } from 'next-intl';
// UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from '@/components/ui/breadcrumb';
import SidebarTrigger from '@/components/ui/sidebar';
import Link from 'next/link';

export default function DashboardSkeleton({ accessDenied = false }) {
  const t = useTranslations('Console');

  if (accessDenied) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <img src="/images/emojies/emj-01.webp" alt="404" width={120} height={120} />
        <h2 className="mt-3 mb-1 text-xl font-semibold text-red-600">{t('accessDenied')}</h2>
        <p className="text-muted-foreground">
          <Link
            href="/settings/instagram"
            className="hover:text-primary text-blue-600 underline underline-offset-8"
          >
            {t('accessNote')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="_dashboard">
      <header className="flex h-16 flex-col gap-4 border-b-2 border-gray-100 bg-white px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="_wrap flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="h-4 w-24 animate-pulse rounded-md bg-gray-200"></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="_tools"></div>
      </header>

      <div className="_wrapper">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="animate-pulse border-l-2 border-gray-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="h-6 w-32 rounded-md bg-gray-200"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2 h-8 w-16 rounded-md bg-gray-200"></div>
                <div className="h-4 w-24 rounded-md bg-gray-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="col-span-1 mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 animate-pulse border-y-2 border-l-2 border-gray-100 lg:col-span-4">
            <CardHeader>
              <CardTitle className="h-6 w-48 rounded-md bg-gray-200"></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full rounded-md bg-gray-200"></div>
            </CardContent>
          </Card>

          <Card className="col-span-1 animate-pulse border-y-2 border-gray-100 lg:col-span-3">
            <CardHeader>
              <CardTitle className="h-6 w-48 rounded-md bg-gray-200"></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="h-9 w-9 rounded-full bg-gray-200"></div>
                    <div className="flex w-full flex-col space-y-2">
                      <div className="h-4 w-32 rounded-md bg-gray-200"></div>
                      <div className="h-4 w-48 rounded-md bg-gray-200"></div>
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
