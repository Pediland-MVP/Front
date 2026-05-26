"use client";

import { useState } from "react";
import useSWR from "swr";
import api, { fetcher } from "@/hooks/swr/api-client";
import { usePermissions } from "@/hooks/usePermissions";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "lucide-react";

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

export default function MemberPermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params["memberId"] as string;
  const tPerms = useTranslations("Permissions");

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

  const { data: availablePermissionsRes, isLoading: isLoadingAvailable } = useSWR<any>(
    workspaceId ? `/workspaces/${workspaceId}/permissions/available` : null,
    fetcher
  );

  const { data: memberPermissionsRes, isLoading: isLoadingMember, mutate: mutateMemberPermissions } = useSWR<any>(
    workspaceId && memberId ? `/workspaces/${workspaceId}/permissions/members/${memberId}` : null,
    fetcher
  );

  const availablePermissions: Permission[] = Array.isArray(availablePermissionsRes)
    ? availablePermissionsRes
    : (availablePermissionsRes?.data || []);

  const memberPermissions = Array.isArray(memberPermissionsRes)
    ? memberPermissionsRes
    : (memberPermissionsRes?.data || []);

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
        toast.success("دسترسی با موفقیت داده شد");
      } else {
        await api.delete(`/workspaces/${workspaceId}/permissions/members/${memberId}/${permissionSlug}`);
        toast.success("دسترسی با موفقیت گرفته شد");
      }
      mutateMemberPermissions();
    } catch (error) {
      toast.error("خطا در بروزرسانی دسترسی");
    }
  };

  const groupedPermissions = availablePermissions.reduce(
    (acc: Record<string, Permission[]>, perm) => {
      const mod = perm.module || "عمومی";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    },
    {}
  );

  if (isLoadingPermissions || isLoadingAvailable || isLoadingMember) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="_permissions-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl overflow-y-auto">
      <div className="flex h-full flex-col px-4 py-5">
      <div className="flex items-center gap-4 mb-5">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-primary font-semibold">مدیریت دسترسی‌های کاربر</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            شما می‌توانید دسترسی‌های این کاربر را در فضای کاری فعال و یا غیرفعال کنید
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست دسترسی‌ها</CardTitle>
          <CardDescription>دسترسی‌های مورد نیاز کاربر را از لیست زیر انتخاب کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {availablePermissions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm rounded-xl border">
              هیچ دسترسی یافت نشد
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
