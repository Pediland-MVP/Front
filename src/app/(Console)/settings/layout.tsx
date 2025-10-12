"use client";

import { useTranslations } from "next-intl";

import { SettingsOptions } from "@components";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Settings");

  return (
    <div className="_settings-page flex h-full flex-col">
      <div className="flex flex-1">
        <div className="hidden md:block md:w-1/4">
          <SettingsOptions />
        </div>
        <div className="flex-1 md:w-3/4">{children}</div>
      </div>
    </div>
  );
}
