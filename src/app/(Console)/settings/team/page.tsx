"use client";

import { useTranslations } from "next-intl";
import { TeamManager } from "@/components/Settings/TeamManager";

export default function TeamPage() {
  const t = useTranslations("Settings.Team");

  return (
    <div className="_team-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
      <div className="flex h-full flex-col border-gray-100 px-4 py-5 md:pt-0">
        <div className="mb-5">
          <h2 className="text-primary mb-1 font-semibold">{t("title")}</h2>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TeamManager />
        </div>
      </div>
    </div>
  );
}
