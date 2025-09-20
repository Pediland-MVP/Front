'use client'

import { useTranslations } from "next-intl"
import { SubscriptionStatusEnum } from "@/types/subscriptions/enums/subscriptionStatus.enum"
import { useUpgradeContext } from "../context/upgrade.context"
import { CircularProgress } from "./circularProgress"
import { useCallback, useEffect, useState } from "react"
// UI 
import { Badge } from "@befroosh/ui"
import { Button } from "@befroosh/ui"
import { Card } from "@befroosh/ui"
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr"


export default function SubscriptionInfo() {
  const t = useTranslations("Upgrade.Subscriptions")

  const { subscriptions, active, setActive, plans } = useUpgradeContext()

  const activeSubscription = subscriptions?.find((sub) => sub.status === SubscriptionStatusEnum.ACTIVE)
  const reservedSubscriptions = subscriptions?.filter((sub) => sub.status === SubscriptionStatusEnum.RESERVED)

  const getRemainingDays = useCallback((expireDate: string) => {
    const now = new Date()
    const expire = new Date(expireDate)
    const diffTime = expire.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 3600 * 24))
  }, [])

  const remainingDays = activeSubscription ? getRemainingDays(activeSubscription.expire) : 0

  const getPlanById = (planId: number) => {
    return plans?.find((plan) => plan.id === planId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "reserved":
        return "bg-blue-500"
      case "expired":
        return "bg-red-500"
      case "pending":
        return "bg-yellow-500"
      case "cancelled":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (!active.subscriptionInfo) {
    return null
  }

  return (
    <div className="_subscription-info-page flex h-full">
      <div className="sm:w-3/5 h-full">
        <Card className="border-l-2 border-gray-100 h-full p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-primary mb-1">{t('title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t("subscriptionStatus")}
            </p>
          </div>

          <div className="_wrapper">
            {activeSubscription ? (
              <div className="_active-subscription mb-6">
                <h3 className="text-base font-semibold mb-3">{t("activeSubscription")}</h3>
                <div className="_subscription-card flex bg-green-50/50 items-center justify-between p-4 rounded-lg border-2 border-green-200">
                  <div className="_info flex flex-col gap-2 text-sm text-green-700">
                    <div className="flex items-center gap-1">
                      <span>وضعیت:</span><span>{t(activeSubscription.status)}</span>
                    </div>
                    {getPlanById(activeSubscription.planDuration.planId)?.name && (
                      <div className="flex items-center gap-1">
                        <span>نوع اشتراک:</span><span>{getPlanById(activeSubscription.planDuration.planId)?.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span>مدت اشتراک:</span><span>{activeSubscription.planDuration.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>زمان باقی مانده:</span><span>{(remainingDays === 1 || remainingDays === 0) ? t('lastDay') : `${getRemainingDays(activeSubscription.expire!)} روز`}
                      </span>
                    </div>

                  </div>
                  <div className="flex flex-col items-center">
                    <CircularProgress
                      percentage={
                        (getRemainingDays(activeSubscription.expire!) / activeSubscription.planDuration.durationDays) * 100
                      }
                      size={isMobile ? 90 : 100}
                      strokeWidth={8}
                      color="oklch(0.723 0.219 149.579)"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p>{t("noActiveSubscription")}</p>
            )}

            {reservedSubscriptions?.length ? (
              <div className="_reserved-subscription mb-6">
                <h3 className="text-base font-semibold mb-1">{t("reservedSubscriptions")}</h3>
                <p className="text-sm text-muted-foreground mb-3">اشتراک‌های زیر به ترتیب اولویت و بعد از اتمام اشتراک فعال شما، فعال خواهند شد.</p>
                {reservedSubscriptions?.map((sub, index) => (
                  <div className="_subscription-card flex bg-stone-50/50 items-center justify-between mb-4 last:mb-0 p-4 rounded-lg border-2 border-stone-200/80" key={sub.id}>

                    <div className="_info flex flex-col gap-2 text-sm text-stone-500">
                      <div className="flex items-center gap-1">
                        <span>نوع اشتراک:</span><span>{getPlanById(sub.planDuration.planId)?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>مدت اشتراک:</span><span>{sub.planDuration.name}</span>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(sub.status)} text-white px-3 py-1 rounded-full`}>
                      {t(sub.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : null}

            <Button
              variant={"link"}
              size={"lg"}
              onClick={() =>
                setActive({ subscriptionInfo: false, planSelection: true })
              }>
              <ClockCounterClockwise className="w-6 h-6" />
              {t('reserve')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

