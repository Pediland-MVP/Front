"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import api, { useLogout } from "@/hooks/swr/api-client";
import useUser from "@/hooks/useUser";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { usePermissions } from "@/hooks/usePermissions";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { SubscriptionStatusEnum } from "@/types/subscriptions/enums/subscriptionStatus.enum";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage, Spinner } from "@/components/ui";
import { Separator } from "@/components/ui/separator";
import {
  CrownIcon,
  LogOutIcon,
  UserRoundPenIcon,
  CheckIcon,
  UserCircleIcon,
  PlusIcon,
  Settings,
  Instagram,
} from "lucide-react";

interface WorkspaceDrawerProps {
  children: React.ReactNode;
}

export const WorkspaceDrawer = ({ children }: WorkspaceDrawerProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  
  const logout = useLogout();
  const { user: userData, isLoading: isUserLoading } = useUser();
  const { workspaces, isLoading: isWorkspacesLoading, changeWorkspace, mutate } = useWorkspaces();
  const { workspaceId } = usePermissions();
  const { subscriptions } = useSubscriptionStore();

  const activeSubscription = subscriptions?.find(
    (sub) => sub.status === SubscriptionStatusEnum.ACTIVE,
  );

  const tConsole = useTranslations("Console");
  const tSidebar = useTranslations("Console.Sidebar");

  const routeHandler = (route: string) => {
    router.push(route);
    setOpen(false);
  };

  const logoutHandler = async () => {
    setIsLogoutLoading(true);
    try {
      await logout();
      const subStore = useSubscriptionStore.getState();
      subStore.setSubscriptions([]);
      subStore.setPlans([]);
      subStore.setPlansData(undefined);
      router.replace("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLogoutLoading(false);
    }
  };

  const handleWorkspaceSettings = async (e: React.MouseEvent, wsId: string) => {
    e.stopPropagation();
    setOpen(false);
    if (wsId !== workspaceId) {
      try {
        await changeWorkspace(wsId);
      } catch (error) {
        console.error("Error changing workspace for settings:", error);
      }
    }
    router.push("/workspace");
  };

  const handleAddWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsCreatingWorkspace(true);
    try {
      const response = await api.post("/workspaces", { name: newWorkspaceName.trim() });
      const newWs = response?.data?.data || response?.data || response;
      toast.success(tConsole("Workspace.success") || "فضای کاری با موفقیت ایجاد شد");
      
      setIsAddingWorkspace(false);
      setNewWorkspaceName("");
      
      // Auto-switch to the newly created workspace if available
      if (newWs && newWs.id) {
        await changeWorkspace(newWs.id);
      } else {
        mutate(); // fallback: just refresh lists
      }
    } catch (error) {
      console.error("Create workspace error:", error);
      toast.error(tConsole("Workspace.error") || "خطا در ایجاد فضای کاری جدید");
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent dir="rtl" className="px-4 pb-6 font-Yekan bg-white">
        <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-gray-200" />
        
        {/* Profile Details Header */}
        {userData && (
          <div className="flex items-center gap-3 p-3 bg-linear-to-r from-gray-50 to-white rounded-xl border border-gray-100 mb-4 text-right">
            <Avatar className="h-12 w-12 rounded-full border-2 border-primary/20">
              <AvatarImage src={undefined} alt={userData.firstname} />
              <AvatarFallback className="bg-primary/5 text-primary flex items-center justify-center">
                <UserCircleIcon size={32} className="stroke-[1.5]" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-right">
              <span className="font-bold text-gray-800 text-base leading-tight">
                {userData.firstname} {userData.lastname}
              </span>
              <span className="text-xs text-muted-foreground mt-1 tracking-wider">
                {userData.mobile}
              </span>
            </div>
          </div>
        )}

        {/* Workspaces Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between pr-1 mb-1">
            <h3 className="text-xs font-semibold text-gray-500 text-right">
              {tConsole("yourWorkspaces") || "فضاهای کاری شما"}
            </h3>
            {!isAddingWorkspace && (
              <button
                onClick={() => setIsAddingWorkspace(true)}
                className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>افزودن</span>
              </button>
            )}
          </div>
          
          {isAddingWorkspace ? (
            <div className="flex flex-col gap-2 p-3.5 border border-dashed border-primary/30 rounded-xl bg-primary/[0.01] animate-in fade-in duration-200 text-right">
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="نام فضای کاری جدید..."
                className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-primary text-right bg-white text-gray-800"
                disabled={isCreatingWorkspace}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-1 justify-end">
                <button
                  onClick={() => {
                    setIsAddingWorkspace(false);
                    setNewWorkspaceName("");
                  }}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-gray-50 rounded-lg cursor-pointer bg-transparent border-0"
                  disabled={isCreatingWorkspace}
                >
                  انصراف
                </button>
                <button
                  onClick={handleAddWorkspace}
                  className="px-4 py-1.5 text-xs bg-primary text-white font-semibold rounded-lg flex items-center gap-1 cursor-pointer border-0"
                  disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
                >
                  {isCreatingWorkspace ? <Spinner className="w-3 h-3 text-white animate-spin" /> : "ثبت"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {isWorkspacesLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-secondary">
                  <Spinner className="ml-2 h-4 w-4" />
                  <span>{tConsole("loading") || "در حال بارگذاری..."}</span>
                </div>
              ) : workspaces.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  {tConsole("noData") || "فضای کاری یافت نشد"}
                </div>
              ) : (
                workspaces.map((ws) => {
                  const isActive = ws.id === workspaceId;
                  return (
                    <div
                      key={ws.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all text-right",
                        isActive
                          ? "border-primary bg-primary/[0.04] text-primary font-bold shadow-xs"
                          : "border-gray-100 hover:border-gray-200 text-secondary active:bg-gray-50"
                      )}
                    >
                      <button
                        onClick={() => {
                          if (!isActive) changeWorkspace(ws.id);
                        }}
                        className="flex items-center gap-3 flex-1 text-right bg-transparent border-0 p-0 cursor-pointer outline-none"
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold uppercase shrink-0",
                            isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {ws.name.charAt(0)}
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-sm font-medium">{ws.name}</span>
                          {isActive && (
                            <span className="text-[10px] text-primary/80 font-normal mt-0.5">
                              {tConsole("Dashboard.active") || "فعال"}
                            </span>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        {isActive && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                            <CheckIcon size={12} className="stroke-[3]" />
                          </div>
                        )}
                        <button
                          onClick={(e) => handleWorkspaceSettings(e, ws.id)}
                          className={cn(
                            "p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center text-gray-400 hover:text-gray-600 border-0 bg-transparent hover:bg-gray-100",
                            isActive && "text-primary/70 hover:text-primary hover:bg-primary/10"
                          )}
                        >
                          <Settings size={18} className="stroke-[1.8]" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <Separator className="my-4 bg-gray-100" />

        {/* Quick Actions / Account Settings Section */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold text-gray-500 pr-1 text-right mb-1">
            {tConsole("accountSettings") || "تنظیمات حساب کاربری"}
          </h3>

          {activeSubscription?.type !== "credit" && (
            <button
              onClick={() => routeHandler("/settings/subscription")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 text-right text-sm text-secondary transition-all active:bg-gray-100 cursor-pointer"
            >
              <CrownIcon className="text-primary size-5 stroke-[1.8]" />
              <span className="font-medium">{tSidebar("upgradeAccount")}</span>
            </button>
          )}

          <button
            onClick={() => routeHandler("/settings/instagram")}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 text-right text-sm text-secondary transition-all active:bg-gray-100 cursor-pointer"
          >
            <Instagram className="text-primary size-5 stroke-[1.8]" />
            <span className="font-medium">{tSidebar("accounts")}</span>
          </button>

          <button
            onClick={() => routeHandler("/settings")}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 text-right text-sm text-secondary transition-all active:bg-gray-100 cursor-pointer"
          >
            <Settings className="text-gray-500 size-5 stroke-[1.8]" />
            <span className="font-medium">{tSidebar("settings")}</span>
          </button>

          <button
            onClick={() => routeHandler("/settings/profile")}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 text-right text-sm text-secondary transition-all active:bg-gray-100 cursor-pointer"
          >
            <UserRoundPenIcon className="text-gray-500 size-5 stroke-[1.8]" />
            <span className="font-medium">{tSidebar("profile")}</span>
          </button>

          <button
            onClick={logoutHandler}
            disabled={isLogoutLoading}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 text-right text-sm text-red-600 transition-all active:bg-red-100 mt-1 cursor-pointer"
          >
            {isLogoutLoading ? (
              <Spinner className="size-5" />
            ) : (
              <LogOutIcon className="text-red-500 size-5 stroke-[1.8]" />
            )}
            <span className="font-semibold">{tSidebar("logout")}</span>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
