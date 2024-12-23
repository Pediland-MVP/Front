"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
// UI
import { Button } from "@/components/theme/ui/button";
import { TelegramLogo, Headset, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";

export default function Footer() {
  const t = useTranslations("Site.Footer");

  return (
    <div className="_footer" id="contact">
      <footer className="bg-gradient-to-b from-primary to-secondary rounded-tl-3xl rounded-tr-3xl">
        <div className="container max-w-6xl px-3 sm:px-4 xl:px-0 mx-auto">
          <div className="_wrapper flex flex-col items-center justify-center py-16 text-white">
            <div className="_content sm:w-2/3 md:w-3/5 lg:w-2/5 xl:w-full flex flex-col items-center justify-center gap-6 px-6 sm:px-0">
              <div className="_text">
                <h3 className="flex items-center gap-2 mb-1 text-xl font-semibold">
                  <Headset size={28} weight="duotone" />
                  <span>{t("contactUs")}</span>
                </h3>
                <p className="font-light">{t("contactUsText")}</p>
              </div>
              <div className="_links flex items-center justify-center gap-3 w-full xl:w-1/4">
                <Button
                  asChild
                  variant="contact"
                  size="contact"
                  className="bg-green-600 hover:bg-green-600/90 w-full"
                >
                  <Link href="#" target="_blank">
                    <WhatsappLogo size={24} weight="fill" />
                    {t("whatsapp")}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="contact"
                  size="contact"
                  className="bg-sky-600 hover:bg-sky-600/90 w-full"
                >
                  <Link href="#" target="_blank">
                    <TelegramLogo size={24} weight="fill" />
                    {t("telegram")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="_links flex flex-col items-center gap-2 py-6 text-sm font-light text-gray-300">
            <ul className="flex items-center justify-center gap-6">
              <li>
                <Link
                  href="/privacy"
                  className="hover:underline underline-offset-4"
                >
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:underline underline-offset-4"
                >
                  {t("terms")}
                </Link>
              </li>
            </ul>
            <p className="text-center">{t("copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
