"use client";

import { useTranslations } from "next-intl";

import { LayoutPage, SettingsOptions } from "@components";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const t = useTranslations("Settings");

  return (
    <div className="_settings-page flex h-full md:h-[calc(100vh-88px)] rounded-t-3xl bg-gradient-to-t from-white/85 to-white md:rounded-t-none">
      <div className="flex flex-1 gap-3 md:p-3 md:pt-0">
        <div className="hidden rounded-xl border-2 border-gray-100 bg-white p-4 md:block">
          <SettingsOptions />
        </div>

        {children}
      </div>
    </div>
  );
}
