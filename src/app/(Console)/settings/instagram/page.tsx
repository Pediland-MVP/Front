"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { InstagramAccounts } from "@components";

export default function Page() {
  const t = useTranslations("Settings.Accounts");

  return (
    <div className="_instagram-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
      <div className="h-full border-gray-100 px-4 py-5 md:pt-0">
        <div className="mb-3">
          <h2 className="text-primary font-semibold">{t("title")}</h2>
        </div>

        <Suspense>
          <InstagramAccounts />
        </Suspense>
      </div>
    </div>
  );
}
