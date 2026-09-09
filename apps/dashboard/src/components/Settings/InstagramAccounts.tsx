'use client';

import api from '@/hooks/swr/api-client';
import { cn } from '@/lib/utils';
import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';
import { formatNumber } from '@/utils/formatNumber';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import useSWRImmutable from 'swr/immutable';
import { mutate } from 'swr';
import { InstagramNamespace } from '@/types/instagram';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CopyIcon } from '@phosphor-icons/react/dist/ssr/Copy';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { Plug2Icon, Trash2Icon } from 'lucide-react';
import { LoaderSpin } from '../ui-custom/LoaderSpin';
import { DeleteConfirmationDialog } from '../Global/DeleteConfirmationDialog';

import { usePermissions } from '@/hooks/usePermissions';
import { PagePromotionAlert } from './PagePromotionAlert';
import { PageCoverageBadge } from './PageCoverageBadge';
import { InstagramReconnectDialog } from './InstagramReconnectDialog';

const MAX_INSTAGRAM_ACCOUNTS = 5;
const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

interface InstagramAccountsProps {
  /**
   * Called with the number of connected accounts, or `null` while that number is still
   * unknown (the list is loading). The parent gates the "افزودن اکانت" button on the
   * count, and a loading state that reported `0` would read as "first account" and wave
   * the user straight through to /connect, skipping the subscription check.
   */
  onCountChange?: (count: number | null) => void;
}

export const InstagramAccounts = ({ onCountChange }: InstagramAccountsProps) => {
  const router = useRouter();
  const t = useTranslations('Settings.Accounts');
  const { can } = usePermissions();
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [reconnectTarget, setReconnectTarget] = useState<InstagramNamespace.Account | null>(null);

  const canView = can('instagram:view');
  const canManage = can('instagram:manage');

  const apiUrl = canView ? `${API_URL}/instagram/accounts` : null;
  const {
    data: instagramPages,
    isLoading: isInstagramPagesLoading,
    mutate: mutateLocal,
  } = useSWRImmutable<InstagramNamespace.GET['Accounts']>(apiUrl, {
    revalidateOnMount: true,
  });

  // Driven off the loading flag rather than SWR's `onSuccess` so a *failed* fetch also
  // resolves the parent's "unknown" state (to 0) instead of leaving it pending forever.
  useEffect(() => {
    onCountChange?.(isInstagramPagesLoading ? null : (instagramPages?.data?.length ?? 0));
    // `onCountChange` is a setter from the parent; re-running on its identity would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstagramPagesLoading, instagramPages]);

  const handleDelete = useCallback((id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleteLoading(true);
    if (itemToDelete) {
      // How many accounts are left after this delete. Only when none remain do
      // we send the user to /connect; otherwise we keep them on the settings
      // page and just refresh the list so the deleted card disappears.
      const remainingCount =
        instagramPages?.data?.filter((account) => account.id !== itemToDelete).length ?? 0;
      await api
        .delete(`/instagram/${itemToDelete}`)
        .then(async () => {
          toast.success(t('deleteSuccess'));
          await mutate(mutateIncludeStringKey('me'));
          await mutate(mutateIncludeStringKey('instagram'));
          if (remainingCount === 0) {
            router.push('/connect');
          } else {
            await mutateLocal();
          }
        })
        .catch((error) => {
          console.error('Delete Instagram Account Error:', error);
          toast.error(t('deleteError'));
        })
        .finally(() => {
          setIsDeleteLoading(false);
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        });
    }
  };

  if (isInstagramPagesLoading || isDeleteLoading) {
    return <LoaderSpin />;
  }

  // No pages connected yet — invite the user to connect their first account.
  if (instagramPages?.data?.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-14 text-center">
        <div className="bg-instagram flex size-13 items-center justify-center rounded-2xl text-white shadow-lg shadow-pink-500/25">
          <InstagramLogoIcon size={26} weight="bold" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">{t('empty_title')}</h3>
        <p className="text-muted-foreground max-w-xs text-[13px]">{t('empty_description')}</p>
        <Button
          size="sm"
          className="mt-1"
          disabled={!canManage}
          onClick={() => router.push('/connect')}
        >
          <Plug2Icon className="size-4" />
          {t('connectAccount')}
        </Button>
      </div>
    );
  }

  // Always show the full list — valid and invalid pages alike. Invalid cards render
  // with their own red state; clicking "reconnect" on any card opens
  // InstagramReconnectDialog with the connect instructions for that account.
  return (
    <>
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        instagram
      />

      <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {instagramPages?.data?.map((instagram) => (
          <Card
            className={cn(
              'group gap-0 overflow-hidden border-violet-200 p-0 shadow-sm shadow-violet-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-200/70',
              !instagram.isIgTokenValid &&
                'border-destructive/35 shadow-destructive/10 hover:shadow-destructive/15 bg-red-50/60',
            )}
            key={instagram.id}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={cn(
                  'shrink-0 rounded-full p-0.5',
                  instagram.isIgTokenValid ? 'bg-instagram' : 'bg-gray-300',
                )}
              >
                {instagram.profilePictureUrl && !imgErrors[instagram.id] ? (
                  <Image
                    className="aspect-square rounded-full border-2 border-white"
                    src={instagram.profilePictureUrl}
                    width={48}
                    height={48}
                    alt={instagram.name}
                    onError={() =>
                      setImgErrors((prev) => ({
                        ...prev,
                        [instagram.id]: true,
                      }))
                    }
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full border-2 border-white bg-white text-gray-500">
                    <InstagramLogoIcon size={26} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{instagram.name}</div>
                <div className="truncate text-sm text-gray-500">@{instagram.username}</div>
                {instagram.followersCount !== undefined && instagram.followersCount !== null && (
                  <div className="mt-0.5 truncate text-xs text-gray-500">
                    {t('followers_count', { count: formatNumber(instagram.followersCount) })}
                  </div>
                )}
                {!instagram.isIgTokenValid && (
                  <span className="bg-destructive mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-white">
                    <WarningCircleIcon size={12} weight="fill" />
                    {t('need_relogin')}
                  </span>
                )}
              </div>
            </CardContent>

            {/* Subscription validity (plan + days left) is shown for every page,
                including disconnected ones, so users always see their coverage. */}
            <div className="px-4 pb-3">
              {instagram.isPromotion ? (
                <PagePromotionAlert instagramId={instagram.id} />
              ) : (
                <PageCoverageBadge instagramId={instagram.id} />
              )}
            </div>

            <div className="mt-auto flex border-t border-gray-100">
              <Button
                className="text-muted-foreground hover:text-primary h-10 w-full flex-1 rounded-none hover:bg-violet-50"
                variant="ghost"
                type="button"
                size="sm"
                disabled={!canManage}
                onClick={() => {
                  navigator.clipboard.writeText(
                    'https://www.instagram.com/oauth/authorize?client_id=2349711835364274&redirect_uri=https://api.befroosh.app/v1/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments',
                  );
                  toast.success('لینک اتصال با موفقیت کپی شد!');
                }}
              >
                <CopyIcon />
                {t('copy_short')}
              </Button>

              <Button
                className={cn(
                  'text-muted-foreground hover:text-secondary h-10 w-full flex-1 rounded-none border-s border-gray-100 hover:bg-blue-50',
                  !instagram.isIgTokenValid &&
                    'bg-destructive hover:bg-destructive text-white hover:text-white',
                )}
                variant="ghost"
                type="button"
                size="sm"
                disabled={!canManage}
                onClick={() => setReconnectTarget(instagram)}
              >
                <Plug2Icon
                  className={cn('text-secondary', !instagram.isIgTokenValid && 'text-white')}
                />
                {t('reconnect')}
              </Button>

              <Button
                className="text-muted-foreground hover:text-destructive h-10 w-full flex-1 rounded-none border-s border-gray-100 hover:bg-rose-50"
                variant="ghost"
                type="button"
                size="sm"
                disabled={!canManage}
                onClick={() => handleDelete(instagram.id)}
              >
                <Trash2Icon className="text-destructive" />
                {t('delete')}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <InstagramReconnectDialog
        account={reconnectTarget}
        onOpenChange={(open) => {
          if (!open) setReconnectTarget(null);
        }}
      />
    </>
  );
};
