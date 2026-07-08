'use client';

import { useLogout } from '@/hooks/swr/api-client';
import useUser from '@/hooks/useUser';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { cn } from '@/lib/utils';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

// TODO: Refactor Types & Schemas
import { SubscriptionStatusEnum } from '@/types/subscriptions/enums/subscriptionStatus.enum';
import { hasOnlyFreeCredit } from '@/utils/subscription';

import {
  ArrowsClockwiseIcon,
  CheckIcon,
  PlugsConnectedIcon,
  PlugsIcon,
  SignOutIcon,
  UserCircleIcon,
} from '@phosphor-icons/react/dist/ssr';
import { ProgressLine } from '../Console/ProgressLine';
import { Avatar, AvatarFallback, AvatarImage, Button, CardContent } from '../ui';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Spinner } from '../ui/spinner';
import { ButtonLoading } from '../ui-custom/ButtonLoading';
import { CardSimple } from '../ui-custom/CardSimple';

export const UserDetailsCard = () => {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const logout = useLogout();
  const t = useTranslations('Console.Dashboard');
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const { user: userData, error: userError, isLoading: userIsLoading } = useUser();

  const {
    subscriptions,
    isLoading: isSubscriptionsLoading,
    totalRemainingDays,
    totalPurchasedDays,
  } = useSubscriptionStore();

  const [workspacePopoverOpen, setWorkspacePopoverOpen] = useState(false);
  const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState(false);

  const { workspaceId } = usePermissions();
  const { workspaces, isLoading: isWorkspacesLoading, changeWorkspace } = useWorkspaces();
  const currentWorkspace = workspaces.find((w) => w.id === workspaceId);

  const handleSwitchWorkspace = async (wsId: string) => {
    if (wsId === workspaceId) {
      setWorkspacePopoverOpen(false);
      return;
    }
    setIsSwitchingWorkspace(true);
    try {
      await changeWorkspace(wsId);
    } catch (error) {
      console.error('Switch workspace error:', error);
    } finally {
      setIsSwitchingWorkspace(false);
      setWorkspacePopoverOpen(false);
    }
  };

  const sortedInstagrams = useMemo(() => {
    if (!userData?.instagrams?.length) return [];
    return [...userData.instagrams]
      .sort((a, b) => Number(a.isIgTokenValid) - Number(b.isIgTokenValid))
      .slice(0, 3);
  }, [userData?.instagrams]);

  const activeSubscription = useMemo(() => {
    if (!subscriptions?.length) return undefined;

    return subscriptions?.find((sub) => sub.status === SubscriptionStatusEnum.ACTIVE);
  }, [subscriptions]);

  const expiredSubscription = useMemo(() => {
    if (!subscriptions?.length) return undefined;

    return subscriptions?.find((sub) => sub.status === SubscriptionStatusEnum.EXPIRED);
  }, [subscriptions]);

  const currentSubscription = activeSubscription || expiredSubscription;
  const hasActiveSubscription =
    currentSubscription?.status === SubscriptionStatusEnum.ACTIVE ? true : false;

  const logoutHandler = async () => {
    setIsLogoutLoading(true);

    try {
      await logout();
      const subStore = useSubscriptionStore.getState();
      subStore.setSubscriptions([]);
      subStore.setPlans([]);
      subStore.setPlansData(undefined);
      router.replace('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLogoutLoading(false);
    }
  };

  return (
    <CardSimple className="border-dashed border-blue-300/70 bg-linear-to-t from-white/85 to-white/50">
      <CardContent className="flex flex-col gap-1.5 p-3">
        {!isSubscriptionsLoading && (
          <div className="text-secondary flex flex-col pb-1 text-[13px]">
            {/* <div className="mb-1 flex items-center justify-between">
                <div
                  className={cn(
                    "flex items-center gap-1 text-green-600",
                    hasActiveSubscription
                      ? "text-green-600"
                      : "text-destructive",
                  )}
                >
                  <CircleIcon
                    size={10}
                    weight="fill"
                    className="animate-pulse"
                  />

                  {hasActiveSubscription ? (
                    <span>اشتراک فعال است</span>
                  ) : (
                    <span>اشتراک فعال ندارید</span>
                  )}
                </div>

                <span className="text-muted-foreground">نوع اشتراک:</span>
                <span
                  className={cn(
                    "flex-1",
                    !hasActiveSubscription && "text-muted-foreground",
                  )}
                >
                  {isSubscriptionsLoading ? (
                    <LoaderPulse />
                  ) : currentSubscription?.type === "credit" ? (
                    "رایـگـان"
                  ) : (
                    currentSubscription?.planDuration?.name
                  )}
                </span>
              </div> */}

            {!hasOnlyFreeCredit(subscriptions) && (
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">{t('remain')}:</span>
                  <span
                    className={cn(
                      'text-primary',
                      !hasActiveSubscription && 'text-muted-foreground',
                    )}
                  >
                    {currentSubscription?.type === 'credit'
                      ? `${currentSubscription?.credit} ${t('message')}`
                      : `${totalRemainingDays} ${t('day')}`}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="gap- h-auto"
                  onClick={() => router.push('/settings/subscription')}
                >
                  {t('renewal')}
                  {/* {hasActiveSubscription ? "جـزئـیـات" : "خرید اشتراک"} */}
                </Button>
              </div>
            )}

            <div className="mb-1 flex items-center gap-1">
              <span className="text-muted-foreground">
                {userData?.mobile ? t('mobile') : t('email')}:
              </span>
              <span className="tracking-wider">{userData?.mobile || userData?.email}</span>
            </div>

            {currentWorkspace && (
              <div className="mb-1 flex items-center gap-1">
                <span className="text-muted-foreground">{t('workspace')}:</span>
                <span className="line-clamp-1 flex-1 font-semibold">{currentWorkspace.name}</span>
                <Popover open={workspacePopoverOpen} onOpenChange={setWorkspacePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="text-muted-foreground hover:text-primary shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0.5 transition-colors hover:bg-gray-100"
                      title="تغییر فضای کاری"
                    >
                      {isSwitchingWorkspace ? (
                        <Spinner className="size-3.5 animate-spin" />
                      ) : (
                        <ArrowsClockwiseIcon size={14} weight="bold" />
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={6}
                    className="font-Yekan w-56 p-2"
                    dir="rtl"
                  >
                    <p className="text-muted-foreground mb-1.5 px-1 text-[11px] font-semibold">
                      فضاهای کاری
                    </p>
                    {isWorkspacesLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Spinner className="size-4" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {workspaces.map((ws) => {
                          const isActive = ws.id === workspaceId;
                          return (
                            <button
                              key={ws.id}
                              onClick={() => handleSwitchWorkspace(ws.id)}
                              disabled={isSwitchingWorkspace}
                              className={cn(
                                'flex w-full cursor-pointer items-center gap-2 rounded-md border-0 px-2 py-1.5 text-right text-sm transition-colors',
                                isActive
                                  ? 'bg-primary/8 text-primary font-semibold'
                                  : 'text-secondary hover:bg-gray-50',
                              )}
                            >
                              <div
                                className={cn(
                                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold uppercase',
                                  isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600',
                                )}
                              >
                                {ws.name.charAt(0)}
                              </div>
                              <span className="flex-1 truncate text-right">{ws.name}</span>
                              {isActive && (
                                <CheckIcon
                                  size={14}
                                  weight="bold"
                                  className="text-primary shrink-0"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="mb-2 flex flex-col gap-1">
              {sortedInstagrams.map((ig) => (
                <div key={ig.id} className="flex items-center gap-1">
                  <span
                    className={cn(
                      'text-muted-foreground',
                      !ig.isIgTokenValid && 'text-destructive',
                    )}
                  >
                    {t('instagram')}:
                  </span>
                  <span
                    className={cn(
                      'line-clamp-1 flex-1 font-semibold tracking-wider',
                      !ig.isIgTokenValid && 'text-destructive',
                    )}
                  >
                    {ig.username}
                  </span>
                  {ig.isIgTokenValid ? (
                    <PlugsConnectedIcon size={20} weight="duotone" className="text-green-600" />
                  ) : (
                    <PlugsIcon size={20} weight="duotone" className="text-destructive" />
                  )}
                </div>
              ))}
            </div>

            {!hasOnlyFreeCredit(subscriptions) && (
              <ProgressLine
                percentage={isSubscriptionsLoading ? 0 : totalRemainingDays}
                height={5}
                type="days"
                totalDays={totalPurchasedDays}
              />
            )}
          </div>
        )}

        <div className="text-secondary flex items-center">
          <div className="flex flex-1 items-center gap-1 text-[13px]">
            <Avatar className="h-6 w-6 rounded-lg border-0 duration-300 focus-within:ring-0">
              <AvatarImage src={undefined} alt={userData.firstname} />
              <AvatarFallback className="bg-transparent">
                <UserCircleIcon size={28} weight="duotone" />
              </AvatarFallback>
            </Avatar>
            <span className="truncate font-medium">
              {userData.firstname} {userData.lastname}
            </span>
          </div>
          <ButtonLoading
            variant="ghost"
            isLoading={isLogoutLoading}
            className="h-auto p-0! [&_svg:not([class*='size-'])]:size-5"
            onClick={logoutHandler}
          >
            {isLogoutLoading ? (
              ''
            ) : (
              <SignOutIcon className={cn(locale === 'fa' && 'rotate-180')} size={20} />
            )}
          </ButtonLoading>
        </div>
      </CardContent>
    </CardSimple>
  );
};
