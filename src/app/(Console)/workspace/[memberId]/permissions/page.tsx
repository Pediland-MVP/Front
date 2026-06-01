"use client";

import { useState } from "react";
import useSWR from "swr";
import api, { fetcher } from "@/hooks/swr/api-client";
import { usePermissions } from "@/hooks/usePermissions";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "lucide-react";
import { useWorkspaces } from "@/hooks/useWorkspaces";

interface Permission {
  id: string;
  slug: string;
  module?: string;
  action?: string;
  description?: string;
}

interface MemberPermission {
  id: string;
  permissionId: string;
  permission: Permission;
  memberId: string;
  isGranted: boolean;
}

interface WorkspaceMember {
  id: string;
  status?: string;
  user: {
    id: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    mobile?: string;
  };
}

export default function MemberPermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params["memberId"] as string;
  const tPerms = useTranslations("Permissions");
  const tTeam = useTranslations("Settings.Team");
  const t_ec = useTranslations("ERROR_CODES");
  const { workspaces } = useWorkspaces();

  const getPermissionLabel = (slug: string) => {
    const [module, action] = slug.split(":");
    try {
      return tPerms(`${module}.${action?.replace(/-/g, "_")}` as any);
    } catch {
      return slug;
    }
  };

  const getModuleLabel = (module: string) => {
    try {
      return tPerms(`_modules.${module}` as any);
    } catch {
      return module;
    }
  };

  const getPermissionDescription = (slug: string) => {
    const [module, action] = slug.split(":");
    try {
      return tPerms(`${module}.${action?.replace(/-/g, "_")}_desc` as any);
    } catch {
      return "";
    }
  };

  const { workspaceId, isLoading: isLoadingPermissions } = usePermissions();

  const { data: membersRes, isLoading: isLoadingMembers } = useSWR<any>(
    workspaceId ? `/workspaces/${workspaceId}/members` : null,
    fetcher
  );
  const members: WorkspaceMember[] = membersRes?.items || membersRes?.data || membersRes || [];
  const member = members.find((m) => m.id === memberId);
  const activeWorkspace = workspaces.find((w: any) => w.id === workspaceId);
  const ownerId = activeWorkspace?.ownerId;
  const isMemberOwner = !!member && member.user?.id === ownerId;

  const memberFullName = member
    ? (member.user?.firstname || member.user?.lastname
        ? `${member.user?.firstname || ""} ${member.user?.lastname || ""}`.trim()
        : tTeam("member"))
    : "";
  const memberInitials = member
    ? ((member.user?.firstname?.[0] || "") + (member.user?.lastname?.[0] || "")).toUpperCase() || "؟"
    : "؟";
  const memberContact = member?.user?.mobile || member?.user?.email || "";

  const { data: availablePermissionsRes, isLoading: isLoadingAvailable } = useSWR<any>(
    workspaceId ? `/workspaces/${workspaceId}/permissions/available` : null,
    fetcher
  );

  const { data: memberPermissionsRes, isLoading: isLoadingMember, mutate: mutateMemberPermissions } = useSWR<any>(
    workspaceId && memberId ? `/workspaces/${workspaceId}/permissions/members/${memberId}` : null,
    fetcher
  );

  const availablePermissions: Permission[] = availablePermissionsRes?.items
    || (Array.isArray(availablePermissionsRes) ? availablePermissionsRes : (availablePermissionsRes?.data || []));

  const memberPermissions = memberPermissionsRes?.items
    || (Array.isArray(memberPermissionsRes) ? memberPermissionsRes : (memberPermissionsRes?.data || []));

  const isPermissionGranted = (permissionSlug: string) => {
    return memberPermissions.some(
      (mp: any) => (mp.permission?.slug === permissionSlug || mp.slug === permissionSlug)
    );
  };

  const handleTogglePermission = async (permissionSlug: string, isGranted: boolean) => {
    if (!workspaceId) return;
    try {
      if (isGranted) {
        await api.post(`/workspaces/${workspaceId}/permissions/members/${memberId}/assign`, {
          permissions: [permissionSlug],
        });
        toast.success(tPerms("grant_success"));
      } else {
        await api.delete(`/workspaces/${workspaceId}/permissions/members/${memberId}/${permissionSlug}`);
        toast.success(tPerms("revoke_success"));
      }
      mutateMemberPermissions();
    } catch (error: any) {
      const code = error?.response?.data?.code;
      toast.error(t_ec(code) || tPerms("update_error"));
    }
  };

  const groupedPermissions = availablePermissions.reduce(
    (acc: Record<string, Permission[]>, perm) => {
      const mod = perm.module || "general";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    },
    {}
  );

  if (isLoadingPermissions || isLoadingAvailable || isLoadingMember || isLoadingMembers) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="_permissions-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl overflow-y-auto">
      <div className="flex h-full flex-col px-4 py-5">
      <div className="flex items-center gap-3 mb-5">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <h2 className="text-primary font-semibold">{tPerms("page_title")}</h2>
      </div>

      {member && (
        <div className="mb-5 flex flex-col items-center gap-3 rounded-2xl border bg-gradient-to-b from-primary/5 to-white px-4 py-6 text-center">
          <Avatar className="h-20 w-20 shrink-0 ring-4 ring-white shadow-sm">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {memberInitials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <p className="font-semibold text-base text-gray-900">{memberFullName}</p>
              <Badge variant={isMemberOwner ? "default" : "secondary"} className="text-[10px]">
                {isMemberOwner ? tTeam("owner") : tTeam("member")}
              </Badge>
            </div>
            {memberContact && (
              <p className="text-muted-foreground text-xs" dir="ltr">
                {memberContact}
              </p>
            )}
            {member.user?.email && member.user?.mobile && (
              <p className="text-muted-foreground text-xs" dir="ltr">
                {member.user.email}
              </p>
            )}
          </div>
          <p className="text-muted-foreground text-xs mt-1 max-w-sm">
            {tPerms("user_description")}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tPerms("card_title")}</CardTitle>
          <CardDescription>{tPerms("card_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {availablePermissions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm rounded-xl border">
              {tPerms("empty")}
            </div>
          ) : (
            Object.entries(groupedPermissions).map(([moduleName, perms]) => (
              <div key={moduleName}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
                  {getModuleLabel(moduleName)}
                </p>
                <div className="divide-y divide-gray-100 rounded-xl border bg-white overflow-hidden">
                  {perms.map((permission) => (
                    <div key={permission.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {getPermissionLabel(permission.slug)}
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {getPermissionDescription(permission.slug)}
                        </p>
                      </div>
                      <Switch
                        checked={isPermissionGranted(permission.slug)}
                        onCheckedChange={(checked) =>
                          handleTogglePermission(permission.slug, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
