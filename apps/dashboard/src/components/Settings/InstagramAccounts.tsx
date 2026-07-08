'use client';

import api from '@/hooks/swr/api-client';
import { cn } from '@/lib/utils';
import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import useSWRImmutable from 'swr/immutable';
import { mutate } from 'swr';
import { InstagramNamespace } from '@/types/instagram';

import { Badge, Button, Card, CardContent, CardFooter } from '@/components/ui';
import { CopyIcon, InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr';
import { Plug2Icon, Trash2Icon } from 'lucide-react';
import { LoaderSpin } from '../ui-custom/LoaderSpin';
import { DeleteConfirmationDialog } from '../Global/DeleteConfirmationDialog';

import { usePermissions } from '@/hooks/usePermissions';
import { PagePromotionAlert } from './PagePromotionAlert';
import { PageCoverageBadge } from './PageCoverageBadge';

const MAX_INSTAGRAM_ACCOUNTS = 5;
const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const INSTAGRAM_CLIENT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

interface InstagramAccountsProps {
  onCountChange?: (count: number) => void;
}

export const InstagramAccounts = ({ onCountChange }: InstagramAccountsProps) => {
  const router = useRouter();
  const t = useTranslations('Settings.Accounts');
  const { can } = usePermissions();
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const canView = can('instagram:view');
  const canManage = can('instagram:manage');

  const apiUrl = canView ? `${API_URL}/instagram/accounts` : null;
  const {
    data: instagramPages,
    isLoading: isInstagramPagesLoading,
    mutate: mutateLocal,
  } = useSWRImmutable<InstagramNamespace.GET['Accounts']>(apiUrl, {
    revalidateOnMount: true,
    onSuccess: (data) => onCountChange?.(data?.data?.length ?? 0),
  });

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
      await api
        .delete(`/instagram/${itemToDelete}`)
        .then(async () => {
          toast.success(t('deleteSuccess'));
          await mutate(mutateIncludeStringKey('me'));
          await mutate(mutateIncludeStringKey('instagram'));
          router.push('/connect');
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

  if (!instagramPages?.data?.[0]?.isIgTokenValid) {
    return null;
  }

  return (
    <>
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        instagram
      />

      <div className="grid w-full gap-4 md:grid-cols-3 2xl:grid-cols-4">
        {instagramPages?.data?.map((instagram) => (
          <Card
            className={cn(
              'gap-0 border-violet-200 p-0 shadow-violet-200',
              !instagram.isIgTokenValid &&
                'border-destructive/30 shadow-destructive/10 bg-red-50/50',
            )}
            key={instagram.id}
          >
            <CardContent
              className="cursor-pointer p-4"
              onClick={() => window.open(`https://instagram.com/${instagram.username}`)}
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  {instagram.profilePictureUrl && !imgErrors[instagram.id] ? (
                    <Image
                      className="aspect-square rounded-full"
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
                    <InstagramLogoIcon size={48} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{instagram.name}</div>
                  <div className="truncate text-sm text-gray-500">@{instagram.username}</div>
                  {!instagram.isIgTokenValid && (
                    <Badge variant="destructive" className="mt-1 text-[11px]">
                      {t('relogin')}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>

            <div className="px-4 pb-3">
              {instagram.isPromotion ? (
                <PagePromotionAlert instagramId={instagram.id} />
              ) : (
                <PageCoverageBadge instagramId={instagram.id} />
              )}
            </div>

            <CardFooter className="flex rounded-b-xl bg-gray-100 p-0">
              <Button
                className="text-muted-foreground hover:text-primary h-9 w-full flex-1 rounded-none rounded-br-xl hover:bg-violet-100"
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
                {t('copy_manual')}
              </Button>

              <Button
                className={cn(
                  'text-muted-foreground hover:text-secondary h-9 w-full flex-1 rounded-none hover:bg-blue-100',
                  !instagram.isIgTokenValid &&
                    'bg-destructive hover:bg-destructive text-white hover:text-white',
                )}
                variant="ghost"
                type="button"
                size="sm"
                disabled={!canManage}
                onClick={() => {
                  router.push(
                    `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${API_URL}/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`,
                  );
                }}
              >
                <Plug2Icon
                  className={cn('text-secondary', !instagram.isIgTokenValid && 'text-white')}
                />
                {t('relogin')}
              </Button>

              <Button
                className="text-muted-foreground hover:text-destructive h-9 w-full flex-1 rounded-none rounded-bl-xl hover:bg-rose-100"
                variant="ghost"
                type="button"
                size="sm"
                disabled={!canManage}
                onClick={() => handleDelete(instagram.id)}
              >
                <Trash2Icon className="text-destructive" />
                {t('delete')}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
};
