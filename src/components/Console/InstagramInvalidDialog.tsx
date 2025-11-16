"use client";

import useUser from "@/hooks/useUser";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { ButtonLoading } from "../ui-custom/ButtonLoading";
import { PlugsIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { CopyIcon, PlugIcon } from "lucide-react";

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

  const handleReLogin = () => {
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
        {/* <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <WarningCircleIcon weight="duotone" size={22} />
            خطای حساب اینستاگرام
          </DialogTitle>
          <DialogDescription className="text-destructive">
            اعتبار نشست امنیتی اینستاگرام شما به پایان رسیده است. برای تمدید آن
            لازم است تا دوباره اکانت اینستاگرام خود را متصل نمایید. تا آن زمان
            سرویس دایرکت هوشمند شما غیرفعال است.
          </DialogDescription>
        </DialogHeader> */}

        <DialogHeader className="gap-2">
          <PlugsIcon
            size={46}
            weight="duotone"
            className="text-destructive mx-auto"
          />
          <DialogTitle className="text-destructive text-base sm:justify-center">
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <ol className="list-decimal space-y-1 pr-4 text-sm text-rose-900">
            <li>{t("list_1")}</li>
            <li>{t("list_2")}</li>
            <li>{t("list_3")}</li>
            <li>{t("list_4")}</li>
          </ol>

          <div className="rounded-lg border border-dashed border-rose-300/70 bg-rose-50/80 p-3">
            <p className="text-destructive text-[13px]">{t("description")}</p>
          </div>
        </div>

        <DialogFooter className="flex w-full items-center justify-center">
          <ButtonLoading
            isLoading={isNavigationLoading}
            onClick={handleReLogin}
            className="bg-destructive/90 hover:bg-destructive w-full text-white sm:flex-1"
          >
            <PlugIcon />
            {t("relogin")}
          </ButtonLoading>

          <Button
            variant="outline"
            className="w-full sm:flex-1"
            onClick={() => {
              navigator.clipboard.writeText(
                "https://www.instagram.com/oauth/authorize?client_id=2349711835364274&redirect_uri=https://api.befroosh.app/v1/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments",
              );
              toast.success("لینک اتصال با موفقیت کپی شد!");
            }}
          >
            <CopyIcon />
            کپی لینک اتصال
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
