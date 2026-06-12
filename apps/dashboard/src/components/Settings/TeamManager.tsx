"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo, useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import api, { fetcher } from "@/hooks/swr/api-client";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import Link from "next/link";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Checkbox,
  Badge,
  Avatar,
  AvatarFallback,
} from "@/components/ui";
import { Trash, Shield, Plus, XSquare, UserCircle } from "@phosphor-icons/react";
import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ButtonLoading } from "@/components/ui-custom/ButtonLoading";

type WorkspaceMember = {
  id: string;
  status: string;
  user: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    mobile: string;
  };
};

export function TeamManager() {
  const t = useTranslations("Settings.Team");
  const tPerms = useTranslations("Permissions");
  const t_ec = useTranslations("ERROR_CODES");
  const { workspaceId, can } = usePermissions();
  const { workspaces } = useWorkspaces();
  const canManage = can("team:manage");
  const canInvite = can("team:invite");
  const canRemove = can("team:remove");

  const activeWorkspace = workspaces.find((w: any) => w.id === workspaceId);
  const ownerId = activeWorkspace?.ownerId;

  const { data: membersRes, isLoading: isLoadingMembers, mutate: mutateMembers } = useSWR<any>(
    workspaceId && can("team:view") ? `/workspaces/${workspaceId}/members` : null,
    fetcher
  );
  const members: WorkspaceMember[] = membersRes?.items || membersRes?.data || membersRes || [];

  const { data: availablePermissionsRes } = useSWR<any>(
    workspaceId && can("team:view") && canInvite ? `/workspaces/${workspaceId}/permissions/available` : null,
    fetcher
  );
  const availablePermissions = availablePermissionsRes?.items
    || (Array.isArray(availablePermissionsRes) ? availablePermissionsRes : (availablePermissionsRes?.data || []));

  const { data: invitationsRes, mutate: mutateInvitations } = useSWR<any>(
    workspaceId && can("team:view") ? `/workspaces/${workspaceId}/invitations` : null,
    fetcher
  );
  const invitations = invitationsRes?.items
    || (Array.isArray(invitationsRes) ? invitationsRes : (invitationsRes?.data || []));
  const pendingInvitations = invitations.filter((inv: any) => inv.status === "pending");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const inviteSchema = useMemo(() => z.discriminatedUnion("inviteType", [
    z.object({
      inviteType: z.literal("mobile"),
      mobile: z.string().regex(/^09\d{9}$/, { message: t("invalid_mobile") }),
      email: z.string().optional(),
      permissions: z.array(z.string()).min(1, { message: t("select_permissions_error") }),
      message: z.string().max(500).optional(),
    }),
    z.object({
      inviteType: z.literal("email"),
      mobile: z.string().optional(),
      email: z.string().email({ message: t("invalid_email") }),
      permissions: z.array(z.string()).min(1, { message: t("select_permissions_error") }),
      message: z.string().max(500).optional(),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ]), []);

  const resolver = useMemo(() => zodResolver(inviteSchema), [inviteSchema]);

  const inviteForm = useForm<z.infer<typeof inviteSchema>>({
    resolver,
    defaultValues: {
      inviteType: "mobile",
      mobile: "",
      email: "",
      permissions: [],
      message: "",
    },
  });

  const selectedPermissions = useWatch({ control: inviteForm.control, name: "permissions" }) || [];
  const inviteType = useWatch({ control: inviteForm.control, name: "inviteType" });

  const handleTogglePermission = (slug: string) => {
    const current = inviteForm.getValues("permissions") || [];
    if (current.includes(slug)) {
      inviteForm.setValue(
        "permissions",
        current.filter((p) => p !== slug),
        { shouldValidate: true }
      );
    } else {
      inviteForm.setValue("permissions", [...current, slug], {
        shouldValidate: true,
      });
    }
  };

  const resetInviteForm = useCallback(() => {
    inviteForm.reset({
      inviteType: "mobile",
      mobile: "",
      email: "",
      permissions: [],
      message: "",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInviteOpenChange = useCallback((open: boolean) => {
    if (open) {
      resetInviteForm();
    } else {
      setTimeout(() => resetInviteForm(), 300);
    }
    setInviteOpen(open);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetInviteForm]);

  const onInvite = async (values: z.infer<typeof inviteSchema>) => {
    setIsInviting(true);
    try {
      const payload =
        values.inviteType === "mobile"
          ? { mobile: values.mobile, permissions: values.permissions, message: values.message || undefined }
          : { email: values.email, permissions: values.permissions, message: values.message || undefined };
      await api.post(`/workspaces/${workspaceId}/invitations`, payload);
      toast.success(t("invite_success"));
      setInviteOpen(false);
      setTimeout(() => resetInviteForm(), 300);
      mutateInvitations();
    } catch (e: any) {
      const code = e?.response?.data?.code;
      toast.error(t_ec(code) || t("invite_error"));
    } finally {
      setIsInviting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      toast.success(t("remove_success"));
      mutateMembers();
    } catch (e: any) {
      const code = e?.response?.data?.code;
      toast.error(t_ec(code) || t("remove_error"));
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      await api.patch(`/workspaces/${workspaceId}/invitations/${invitationId}/cancel`);
      toast.success(t("cancel_success"));
      mutateInvitations();
    } catch (e: any) {
      const code = e?.response?.data?.code;
      toast.error(t_ec(code) || t("cancel_error"));
    }
  };

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

  useEffect(() => {
    if (inviteOpen && availablePermissions.length > 0) {
      const current = inviteForm.getValues("permissions");
      if (current.length === 0) {
        inviteForm.setValue("permissions", availablePermissions.map((p: any) => p.slug));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteOpen, availablePermissions.length]);

  const groupedPermissions = availablePermissions.reduce((acc: any, item: any) => {
    const mod = item.module || "general";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(item);
    return acc;
  }, {});

  const getMemberInitials = (member: WorkspaceMember) => {
    const first = member.user?.firstname?.[0] || "";
    const last = member.user?.lastname?.[0] || "";
    return (first + last).toUpperCase() || "؟";
  };

  if (isLoadingMembers) return <LoaderSpin />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("members")}</h3>
        {canInvite && (
          <Dialog open={inviteOpen} onOpenChange={handleInviteOpenChange}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {t("invite")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("invite_member")}</DialogTitle>
                <p className="text-muted-foreground text-xs">{t("invite_desc")}</p>
              </DialogHeader>
              <Form {...inviteForm}>
                <form onSubmit={inviteForm.handleSubmit(onInvite)} className="space-y-6 pt-4">
                  {/* Invite type toggle */}
                  <div className="flex rounded-lg border border-gray-200 p-1 gap-1 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => {
                        inviteForm.setValue("inviteType", "mobile", { shouldValidate: false });
                        inviteForm.setValue("email", "", { shouldValidate: false });
                        inviteForm.clearErrors("email");
                      }}
                      className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                        inviteType === "mobile"
                          ? "bg-white text-primary shadow-sm"
                          : "text-muted-foreground hover:text-gray-700"
                      }`}
                    >
                      {t("invite_by_mobile")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        inviteForm.setValue("inviteType", "email", { shouldValidate: false });
                        inviteForm.setValue("mobile", "", { shouldValidate: false });
                        inviteForm.clearErrors("mobile");
                      }}
                      className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                        inviteType === "email"
                          ? "bg-white text-primary shadow-sm"
                          : "text-muted-foreground hover:text-gray-700"
                      }`}
                    >
                      {t("invite_by_email")}
                    </button>
                  </div>

                  {/* Mobile input */}
                  {inviteType === "mobile" && (
                    <FormField
                      control={inviteForm.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("mobile")}</FormLabel>
                          <FormControl>
                            <Input placeholder="09123456789" dir="ltr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Email input */}
                  {inviteType === "email" && (
                    <FormField
                      control={inviteForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("email_label")}</FormLabel>
                          <FormControl>
                            <Input placeholder="user@example.com" type="email" dir="ltr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="space-y-3">
                    <FormLabel className="block text-sm font-medium">
                      {t("permissions")} <span className="text-red-500">*</span>
                    </FormLabel>
                    {inviteForm.formState.errors.permissions && (
                      <p className="text-destructive text-xs">
                        {inviteForm.formState.errors.permissions.message}
                      </p>
                    )}

                    <div className="border rounded-lg p-4 bg-gray-50/50 space-y-4 max-h-[250px] overflow-y-auto">
                      {Object.keys(groupedPermissions).map((moduleName) => (
                        <div key={moduleName} className="space-y-2">
                          <h4 className="text-xs font-semibold text-primary capitalize border-b pb-1">
                            {getModuleLabel(moduleName)}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {groupedPermissions[moduleName].map((perm: any) => {
                              const isChecked = selectedPermissions.includes(perm.slug);
                              return (
                                <div
                                  key={perm.id}
                                  className="flex items-start gap-2 p-2 rounded-md hover:bg-white border border-transparent hover:border-gray-100 transition-all cursor-pointer"
                                  onClick={() => handleTogglePermission(perm.slug)}
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => handleTogglePermission(perm.slug)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="space-y-0.5 select-none">
                                    <span className="text-xs font-medium text-gray-700">
                                      {getPermissionLabel(perm.slug)}
                                    </span>
                                    {getPermissionDescription(perm.slug) && (
                                      <p className="text-[10px] text-muted-foreground leading-tight">
                                        {getPermissionDescription(perm.slug)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={inviteForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("message")}</FormLabel>
                        <FormControl>
                          <Input placeholder="..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <ButtonLoading isLoading={isInviting} type="submit" className="w-full">
                    {t("invite")}
                  </ButtonLoading>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Active Members List */}
      <div className="divide-y divide-gray-100 rounded-xl border bg-white overflow-hidden">
        {members.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            {t("no_members")}
          </div>
        ) : (
          members.map((member) => {
            const isMemberOwner = member.user?.id === ownerId;
            const fullName =
              member.user?.firstname || member.user?.lastname
                ? `${member.user?.firstname || ""} ${member.user?.lastname || ""}`.trim()
                : t("member");
            return (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {getMemberInitials(member)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{fullName}</p>
                  <p className="text-muted-foreground text-xs truncate">
                    {member.user?.mobile || member.user?.email}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant={isMemberOwner ? "default" : "secondary"} className="text-xs">
                    {isMemberOwner ? t("owner") : t("member")}
                  </Badge>
                  {!isMemberOwner && canManage && (
                    <Link href={`/workspace/${member.id}/permissions`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  {!isMemberOwner && canRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember(member.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-800">{t("pending_invitations")}</h3>
          <div className="divide-y divide-gray-100 rounded-xl border bg-white overflow-hidden">
            {pendingInvitations.map((inv: any) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-amber-100 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{inv.invitedMobile || inv.invitedEmail}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {inv.permissions.map((permSlug: string) => (
                      <Badge key={permSlug} variant="outline" className="text-[10px] py-0 px-1.5">
                        {permSlug}
                      </Badge>
                    ))}
                  </div>
                </div>
                {canInvite && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => cancelInvitation(inv.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                  >
                    <XSquare className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
