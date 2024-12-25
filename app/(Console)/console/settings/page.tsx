"use client";

import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("Settings");

  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-gray-600">{t("chooseOneOption")}</p>
    </div>
  );
}