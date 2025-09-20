"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CardToCardAlert() {
  const t = useTranslations("Products.List.Alert");


  return (
    <div className="w-full flex flex-col justify-center items-center max-w-md mx-auto space-y-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('title')}</AlertTitle>
        <AlertDescription>
          {t('description')}
        </AlertDescription>
        <div className="flex w-full justify-center items-center gap-x-2">
            <Link href={'/settings/card'}>
                <Button className="w-full mt-5">
                {t('cardToCard')}
                </Button>
            </Link>
            <Link href={'/settings/zarinpal'}>
                <Button className="w-full mt-5">
                {t('zarinpal')}
                </Button>
            </Link>
        </div>
      </Alert>
    </div>
  )
}

