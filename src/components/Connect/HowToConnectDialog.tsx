"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components";
import { InstagramLogoIcon } from "@phosphor-icons/react";
import { PlugsIcon } from "@phosphor-icons/react";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

interface HowToConnectDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const HowToConnectDialog = ({
  open,
  setOpen,
}: HowToConnectDialogProps) => {
  const t = useTranslations("Connect");
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (connecting) {
      const timer = setTimeout(() => {
        router.push(
          `https://www.instagram.com/oauth/authorize?client_id=2349711835364274&redirect_uri=${API_URL}/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`,
        );
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [connecting, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="gap-5 bg-violet-50"
        onEscapeKeyDown={(e) => {
          if (connecting) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (connecting) e.preventDefault();
        }}
      >
        {!connecting ? (
          <>
            <DialogHeader className="gap-2">
              <PlugsIcon
                size={46}
                weight="duotone"
                className="text-primary mx-auto"
              />
              <DialogTitle className="text-primary text-base">
                {t("how_to_connect_title")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <ol className="list-decimal space-y-2 pr-4 text-sm text-violet-950">
                <li>{t("how_to_connect_list_1")}</li>
                <li>{t("how_to_connect_list_2")}</li>
                <li>{t("how_to_connect_list_3")}</li>
                <li>{t("how_to_connect_list_4")}</li>
              </ol>

              <div className="mt-5 rounded-lg border border-dashed border-blue-500/60 bg-blue-50/50 p-3">
                <p className="text-[13px] text-blue-900">
                  {t("how_to_connect_description")}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full" onClick={() => setConnecting(true)}>
                {t("how_to_connect_button")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="text-primary flex flex-col items-center gap-2 font-bold">
              <InstagramLogoIcon size={36} className="text-primary" />
              {t("connecting_title")}
            </div>
            <div className="text-muted-foreground text-center text-sm">
              {t("connecting_description")}
            </div>

            <div className="h-8 w-4/5 bg-[url('/images/loading.gif')] bg-cover bg-center bg-no-repeat"></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
