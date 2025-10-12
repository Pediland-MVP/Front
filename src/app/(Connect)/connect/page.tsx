"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

import { Button, HelpMeDialog } from "@/components/index";
import { PlugsIcon } from "@phosphor-icons/react/dist/ssr";
import { SquarePlayIcon } from "lucide-react";
import { HowToConnectDialog } from "@/components/Connect/HowToConnectDialog";

export default function ConnectPage() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const t = useTranslations("Connect");

  return (
    <>
      <HowToConnectDialog open={isDialogOpen} setOpen={setDialogOpen} />

      <div className="container mx-auto flex h-full flex-col justify-around md:max-w-sm">
        <div className="flex flex-col items-center space-y-6">
          <PlugsIcon size={60} weight="duotone" className="text-secondary" />
          <p className="text-center font-medium">
            {t("title1")}
            <br />
            {t("title2")}
          </p>
          <Button className="w-full" onClick={() => setDialogOpen(true)}>
            {t("connect_account")}
          </Button>
        </div>

        <HelpMeDialog
          title={t("how_to_connect")}
          videoSrc="https://befroosh.storage.iran.liara.space/IMG_2330.MOV"
          videoPoster="/images/photo_2025-02-26_22-00-50.jpg"
          noAbsolute
        >
          <Button
            type="button"
            variant="link"
            size="lg"
            className="text-muted-foreground"
          >
            <SquarePlayIcon className="size-5.5" />
            {t("how_to_connect")}
          </Button>
        </HelpMeDialog>

        <div className="mx-auto flex flex-col items-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-4">
            <Image
              src="/images/logo-threads.svg"
              alt="Threads Logo"
              className="h-7"
              width={28}
              height={28}
            />
            <Image
              src="/images/logo-instagram.svg"
              alt="Instagram Logo"
              className="h-7 w-auto"
              width={28}
              height={28}
            />
            <Image
              src="/images/logo-meta.svg"
              alt="Meta Logo"
              className="h-6"
              width={120}
              height={24}
            />
          </div>

          <p className="mb-2 text-center">
            <span className="font-semibold">{t("befroosh_meta_partner")}</span>{" "}
            <span className="text-sm">({t("instagram_holding")})</span>{" "}
            {t("description")}
          </p>
        </div>
      </div>
    </>
  );
}
