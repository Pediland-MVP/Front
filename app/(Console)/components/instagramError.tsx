import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Instagram } from 'lucide-react'
import { useTranslations } from "next-intl"

export function InstagramError() {
  const t = useTranslations("Console")

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Instagram className="h-6 w-6" />
          <span>{t("instagramStats")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-[200px] space-y-4">
          <p className="text-lg font-medium text-center">{t("pleaseAddInstagram")}</p>
          <p className="text-sm text-muted-foreground text-center">{t("instagramDataUnavailable")}</p>
        </div>
      </CardContent>
    </Card>
  )
}

