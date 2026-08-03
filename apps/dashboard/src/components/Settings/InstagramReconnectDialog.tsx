'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { InstagramNamespace } from '@/types/instagram';
import { PlugsIcon } from '@phosphor-icons/react/dist/ssr/Plugs';
import { CopyIcon, PlugIcon, TvMinimalPlayIcon } from 'lucide-react';
import { ButtonLoading } from '../ui-custom/ButtonLoading';
import { HelpMeDialog } from '../Global/HelpMeDialog';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const INSTAGRAM_CLIENT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

const MANUAL_CONNECT_LINK =
  'https://www.instagram.com/oauth/authorize?client_id=2349711835364274&redirect_uri=https://api.befroosh.app/v1/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments';

interface InstagramReconnectDialogProps {
  account: InstagramNamespace.Account | null;
  onOpenChange: (open: boolean) => void;
}

export const InstagramReconnectDialog = ({
  account,
  onOpenChange,
}: InstagramReconnectDialogProps) => {
  const router = useRouter();
  const t = useTranslations('instagramTokenError');
  const [isNavigationLoading, setIsNavigationLoading] = useState(false);

  const username = account ? (account.username ? `@${account.username}` : account.name) : '';

  const handleReLogin = () => {
    router.push(
      `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${API_URL}/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`,
    );
    setIsNavigationLoading(true);
  };

  return (
    <Dialog open={!!account} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-5 rounded-2xl p-6 sm:max-w-md sm:p-8">
        <DialogHeader className="items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-14 shrink-0 items-center justify-center rounded-2xl">
            <PlugsIcon size={30} weight="duotone" />
          </div>
          <DialogTitle className="text-primary justify-center text-center text-base font-bold sm:text-lg">
            {t('dialog_title', { username })}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mx-auto max-w-xl text-center text-[13px] leading-6">
            {t('dialog_description')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <ButtonLoading
            isLoading={isNavigationLoading}
            onClick={handleReLogin}
            className="bg-primary w-full text-white hover:bg-purple-500 sm:w-auto"
          >
            <PlugIcon className="size-4" />
            {t('relogin')}
          </ButtonLoading>

          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              navigator.clipboard.writeText(MANUAL_CONNECT_LINK);
              toast.success(t('copy_success'));
            }}
          >
            <CopyIcon className="size-4" />
            {t('copy_link')}
          </Button>
        </DialogFooter>

        <HelpMeDialog
          helpId="connect_instagram_invalid"
          title={t('how_to_connect')}
          videoSrc="https://befroosh.s3.ir-thr-at1.arvanstorage.ir/learn%2Ff54e8c002432b82b23a046865a9e9f1067430006-720p.mp4?versionId="
          videoPoster="/images/photo_2025-02-26_22-00-50.jpg"
          noAbsolute
        >
          <Button type="button" variant="link" size="sm" className="text-muted-foreground mx-auto">
            <TvMinimalPlayIcon className="size-5" />
            {t('how_to_connect')}
          </Button>
        </HelpMeDialog>
      </DialogContent>
    </Dialog>
  );
};
