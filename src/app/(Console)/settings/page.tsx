"use client";

import { useTranslations } from "next-intl";

import { SettingsOptions } from "@components";

export default function SettingsPage() {
  const t = useTranslations("Settings");

  return (
    <div className="flex w-full md:items-center justify-center rounded-t-3xl md:rounded-t-none">
      <p className="text-muted-foreground hidden text-sm md:block">
        {t("choose_one_option")}
      </p>

      <div className="w-full md:hidden">
        <SettingsOptions />
      </div>
    </div>
  );
}
