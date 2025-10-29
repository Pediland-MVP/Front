"use client";

import useUser from "@/hooks/useUser";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Button,
  ButtonLoading,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const INSTAGRAM_CLIENT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

export const InstagramInvalidDialog = () => {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("instagramTokenError");

  const [showPopup, setShowPopup] = useState(false);
  const [isAborted, setIsAborted] = useState(false);
  const [isNavigationLoading, setIsNavigationLoading] = useState(false);

  const { user } = useUser();

  useEffect(() => {
    // When user is in settings/isntagram it's maybe redirected from relogin
    // So We shouldn't show this message to that
    if (pathname.startsWith("/settings/instagram")) return;

    // Show the popup only once when the component mounts
    if (!isAborted && user && user.instagrams) {
      if (
        user.instagrams.find(
          (ig) =>
            ig.isIgTokenValid === false || ig.isIgWebhookSubscribed === false,
        )
      ) {
        setIsNavigationLoading(false);
        setShowPopup(true);
      }
    }
  }, [user, isAborted, pathname]);

  const handleGoToSettings = () => {
    // router.push(`${API_URL}/instagram/connectIG`);
    router.push(
      `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${API_URL}/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`,
    );
    setIsNavigationLoading(true);
    setIsAborted(true);
    // setShowPopup(false)
  };

  const handleClose = () => {
    setIsAborted(true);
    setShowPopup(false);
  };

  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <WarningCircleIcon weight="duotone" size={22} />
            خطای حساب اینستاگرام
          </DialogTitle>
          <DialogDescription className="text-destructive">
            اعتبار نشست امنیتی اینستاگرام شما به پایان رسیده است. برای تمدید آن
            لازم است تا دوباره اکانت اینستاگرام خود را متصل نمایید. تا آن زمان
            سرویس دایرکت هوشمند شما غیرفعال است.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-x-2">
          <ButtonLoading
            isLoading={isNavigationLoading}
            onClick={handleGoToSettings}
            className="bg-destructive/90 hover:bg-destructive text-white"
          >
            {t("buttons.relogin")}
          </ButtonLoading>

          <Button variant="outline" onClick={handleClose}>
            متوجه شدم!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
