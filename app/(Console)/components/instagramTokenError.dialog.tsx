"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import useUser from "@/hooks/useUser"
import ButtonLoading from "@/components/ui/button-loading"

export default function InstagramTokenErrorDialog() {
  const [showPopup, setShowPopup] = useState(false)
  const [isAborted, setIsAborted] = useState(false)
  const [isNavigationLoading, setIsNavigationLoading] = useState(false)
  const t = useTranslations("instagramTokenError")
  const pathname = usePathname()

  const router = useRouter()
  
  const { user } = useUser()
  
  useEffect(() => {

    // When user is in settings/isntagram it's maybe redirected from relogin
    // So We shouldn't show this message to that
    if (pathname.startsWith('/settings/instagram')) return
    
    // Show the popup only once when the component mounts
    if (!isAborted && user) {
      if (user.instagrams.find(ig => ig.isIgTokenValid === false)) {
        setIsNavigationLoading(false)
        setShowPopup(true)
      }
    }
  }, [user, isAborted, pathname])

  const handleGoToSettings = () => {
    router.push(`${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/connectIG`)
    setIsNavigationLoading(true)
    setIsAborted(true)
    // setShowPopup(false)
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
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-x-2">
          <Button variant="outline" onClick={handleClose}>
            {t("buttons.ok")}
          </Button>
          <ButtonLoading isLoading={isNavigationLoading} onClick={handleGoToSettings}>{t("buttons.relogin")}</ButtonLoading>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
