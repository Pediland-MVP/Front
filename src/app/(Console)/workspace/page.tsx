"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { WorkspaceForm } from "@/components/Settings/WorkspaceForm";
import { TeamManager } from "@/components/Settings/TeamManager";
import { Separator } from "@/components/ui/separator";
import { useInvitations } from "@/hooks/useInvitations";

export default function WorkspacePage() {
  const tWorkspace = useTranslations("Settings.Workspace");
  const tTeam = useTranslations("Settings.Team");
  const router = useRouter();
  const { pendingCount, isLoading: isInvitationsLoading } = useInvitations();

  return (
    <div className="_workspace-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl overflow-y-auto">
      <div className="flex min-h-full flex-col border-gray-100 px-4 py-6 md:py-8 md:px-8 space-y-8 animate-in fade-in duration-300">

        {/* Invitation Banner */}
        {!isInvitationsLoading && pendingCount > 0 && (
          <button
            onClick={() => router.push("/invitations")}
            className="flex w-full items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-right transition-all hover:bg-blue-100"
          >
            <EnvelopeSimpleIcon size={20} weight="duotone" className="shrink-0 text-blue-600" />
            <span className="flex-1 text-sm font-medium text-blue-800">
              شما {pendingCount} دعوتنامه دارید
            </span>
            <span className="text-xs font-semibold text-blue-600">مشاهده ←</span>
          </button>
        )}

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
