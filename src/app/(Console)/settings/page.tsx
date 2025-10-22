"use client";

import { useTranslations } from "next-intl";

import { SettingsOptions } from "@components";

export default function SettingsPage() {
  const t = useTranslations("Settings");

  return (
    <div className="flex h-full justify-center rounded-t-3xl bg-white md:items-center md:rounded-t-none">
      <p className="hidden text-sm text-gray-600 md:block">
        {t("chooseOneOption")}
      </p>

      <div className="w-full md:hidden">
        <SettingsOptions />
      </div>
    </div>
  );
}
