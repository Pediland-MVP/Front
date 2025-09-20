"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@befroosh/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@befroosh/ui"
import { AlertCircle } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import useUser from "@/hooks/useUser"
import ButtonLoading from "@befroosh/ui"

export default function SubscriptionExpireWarningDialog() {
  const [showPopup, setShowPopup] = useState(false)
  const [isAborted, setIsAborted] = useState(false)
  const [isNavigationLoading, setIsNavigationLoading] = useState(false)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const t = useTranslations("subscriptionWarning")
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()

  useEffect(() => {
    if (!user || isAborted) return

    // Don't show on upgrade settings page
    if (pathname.startsWith('/settings/upgrade')) return

    const isHaveReserved = user.subscriptions.find(sub => sub.status === 'reserved')
    if (isHaveReserved) return

    // Find active subscription
    const activeSub = user.subscriptions.find(sub => sub.status === 'active' && sub.expire)
    if (!activeSub) return

    const expireDate = new Date(activeSub.expire)
    const now = new Date()
    const timeDiff = expireDate.getTime() - now.getTime()
    const calculatedDaysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

    // Show if expires within 3 days (including today)
    if (calculatedDaysLeft > 0 && calculatedDaysLeft <= 3) {
      setDaysLeft(calculatedDaysLeft)
      setIsNavigationLoading(false)
      setShowPopup(true)
    }
  }, [user, isAborted, pathname])

  const handleUpgrade = () => {
    setShowPopup(false)
    setIsAborted(true)
    router.push('/settings/upgrade?active=planSelection')
  }

  const handleClose = () => {
    setIsAborted(true)
    setShowPopup(false)
  }

  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {daysLeft !== null && t("description", { count: daysLeft })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-x-2">
          <Button variant="outline" onClick={handleClose}>
            {t("buttons.ok")}
          </Button>
          <ButtonLoading isLoading={isNavigationLoading} onClick={handleUpgrade}>
            {t("buttons.upgrade")}
          </ButtonLoading>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
