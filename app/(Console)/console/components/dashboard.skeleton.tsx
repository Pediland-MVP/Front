"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar } from "@/components/ui/avatar"
import { FileText, InstagramLogo, Package, TrendUp, Users } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { useTranslations } from "next-intl"
import Image from "next/image"

interface DashboardSkeletonProps {
  accessDenied?: boolean
}

export default function DashboardSkeleton({ accessDenied = false }: DashboardSkeletonProps) {
  const t = useTranslations('Skeleton')
  return (
    <div className="flex-1 space-y-4 p-8 pt-6 relative">
      {accessDenied && (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-10 backdrop-blur-sm bg-background/70">
          <Card className="w-full max-w-md text-center">
            <CardContent className="flex flex-col justify-center items-center gap-y-4 py-10">
              <Image src="/images/emojies/face-with-open-eyes-and-hand-overm-mouth.webp" alt="Face With Open Eyes And Hand Over Mouth" width="150" height="150" />
              <CardTitle className="text-2xl font-bold text-primary">{t('title')}</CardTitle>
              <p className="text-muted-foreground">{t('description')}</p>
              <Link href={'/console/accounts'}>
                <Button className="w-full" size="lg">
                  <InstagramLogo className="mr-2 h-4 w-4" />
                  {t('button')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-9 w-[100px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[Package, Users, FileText, TrendUp].map((Icon, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-[100px]" />
              <Icon className="h-4 w-4 text-muted-foreground" />
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
            <Skeleton className="h-6 w-[150px]" />
          </CardHeader>
          <CardContent className="pl-2">
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-[120px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mt-9">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center border rounded-lg p-5">
                  <Avatar>
                    <Skeleton className="h-9 w-9 rounded-full" />
                  </Avatar>
                  <div className="ml-4 space-y-1 flex-1">
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

