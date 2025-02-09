'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CircularProgress } from "./circularProgress"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { SubscriptionStatusEnum } from "@/types/subscriptions/enums/subscriptionStatus.enum"
import { useUpgradeContext } from "../context/upgrade.context"
import { Button } from "@/components/theme/ui/button"
import { Plus } from "@phosphor-icons/react/dist/ssr"


export default function SubscriptionInfo(){
  const t = useTranslations("Upgrade.Subscriptions")

  const { subscriptions, active, setActive, plans } = useUpgradeContext()

  const activeSubscription = subscriptions?.find((sub) => sub.status === SubscriptionStatusEnum.ACTIVE)
  const reservedSubscriptions = subscriptions?.filter((sub) => sub.status === SubscriptionStatusEnum.RESERVED)

  const getRemainingDays = (expireDate: string) => {
    const now = new Date()
    const expire = new Date(expireDate)
    const diffTime = expire.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 3600 * 24))
  }

  const getPlanById = (planId: number) => {
    return plans.find((plan) => plan.id === planId)
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

  if (!active.subscriptionInfo) {
    return null
  }

  return (
    <Card className="w-full max-w-5xl box-border rtl">
      <div className="flex justify-between items-center p-7">
        <div>
          <CardTitle>{t("subscriptionInfo")}</CardTitle>
          <CardDescription>{t("subscriptionStatus")}</CardDescription>
        </div>
        <Button onClick={() => setActive({ subscriptionInfo: false, planSelection: true })}><Plus/> {t('reserve')}</Button>
      </div>
      <CardContent>
        {activeSubscription ? (
          <motion.div
            className="flex flex-col md:flex-row items-center justify-between mb-6 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center md:text-right mb-4 md:mb-0">
              <h3 className="text-xl font-semibold mb-2">{t("activeSubscription")}</h3>
              <p className="text-lg mb-2">{activeSubscription.planDuration.name}</p>
              <Badge className={`${getStatusColor(activeSubscription.status)} text-white px-3 py-1 rounded-full`}>
                {t(activeSubscription.status)}
              </Badge>
            </div>
            <div className="flex flex-col items-center">
              <CircularProgress
                percentage={
                  (getRemainingDays(activeSubscription.expire!) / activeSubscription.planDuration.durationDays) * 100
                }
                size={120}
                strokeWidth={12}
                color="#10B981"
              />
              <p className="mt-2 text-sm font-medium">
                {getRemainingDays(activeSubscription.expire!)} {t("daysRemaining")}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.p
            className="mb-6 text-center text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {t("noActiveSubscription")}
          </motion.p>
        )}

        {reservedSubscriptions?.length ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold mb-4">{t("reservedSubscriptions")}</h3>
            <ul className="space-y-3">
              {reservedSubscriptions?.map((sub, index) => (
                <motion.li
                  key={sub.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg shadow-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >

                  <div className="flex flex-col">
                    <span>{getPlanById(sub.planDuration.planId)?.name}</span>
                    <span className="font-medium">{sub.planDuration.name}</span>
                  </div>

                  <Badge className={`${getStatusColor(sub.status)} text-white px-3 py-1 rounded-full`}>
                    {t(sub.status)}
                  </Badge>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </CardContent>
    </Card>
  )
}

