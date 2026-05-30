"use client";

import { useTranslations } from "next-intl";
import { WorkspaceForm } from "@/components/Settings/WorkspaceForm";
import { TeamManager } from "@/components/Settings/TeamManager";
import { Separator } from "@/components/ui/separator";

export default function WorkspacePage() {
  const tWorkspace = useTranslations("Settings.Workspace");
  const tTeam = useTranslations("Settings.Team");

  return (
    <div className="_workspace-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl overflow-y-auto">
      <div className="flex h-full flex-col border-gray-100 px-4 py-6 md:py-8 md:px-8 space-y-8 animate-in fade-in duration-300">
        {/* Workspace Form Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-primary text-lg font-bold mb-1">{tWorkspace("title")}</h2>
            <p className="text-muted-foreground text-sm">{tWorkspace("description")}</p>
          </div>
          <div className="bg-gray-50/50 rounded-xl p-4 md:p-6 border border-gray-100">
            <WorkspaceForm />
          </div>
        </div>

        <Separator className="bg-gray-100" />

        {/* Team Manager Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-primary text-lg font-bold mb-1">{tTeam("title")}</h2>
            <p className="text-muted-foreground text-sm">{tTeam("description")}</p>
          </div>
          <div className="bg-white rounded-xl">
            <TeamManager />
          </div>
        </div>
      </div>
    </div>
  );
}
