"use client"

import { useState, useEffect } from "react"
import { Package, Truck, Info } from "lucide-react"
import { Card, CardContent } from "@befroosh/ui"
import { Badge } from "@befroosh/ui"
import { Separator } from "@befroosh/ui"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@befroosh/ui"
import { useTranslations } from "next-intl"

interface ShippingInfoProps {
  shippingCost: number | null | undefined
}

export function ShippingInfo({ shippingCost }: ShippingInfoProps) {
  const [isVisible, setIsVisible] = useState(false)
  const t = useTranslations('Checkout.ShippingInfo')

  useEffect(() => {
    // Animation effect when component mounts
    setIsVisible(true)
  }, [])

  if (!shippingCost) {
    return null
  }

  return (
    <div className={`transition-all duration-300 ${isVisible ? "opacity-100" : "opacity-0"} mt-4 mb-6`}>
      <Card className="border border-muted bg-card/50 hover:bg-card/80 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{t("shippingMethod")}:</span>
              <span className="text-sm">{t("postCompany")}</span>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("shippingCost")}:</span>
            {
              (shippingCost &&shippingCost > 0) ? (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">{shippingCost.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">{t('toman')}</span>
                </div>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                  {t("freeShipping")}
                </Badge>
              )
            }
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
