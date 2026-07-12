'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import useSWRImmutable from 'swr/immutable';

import { Button } from '@/components/ui';
import { InstagramNamespace } from '@/types/instagram';
import { PlugsIcon } from '@phosphor-icons/react/dist/ssr';
import { CopyIcon, PlugIcon, TvMinimalPlayIcon } from 'lucide-react';
import { ButtonLoading } from '../ui-custom/ButtonLoading';
import { HelpMeDialog } from '../Global/HelpMeDialog';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const INSTAGRAM_CLIENT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

// Static "copy this into your browser" link — kept identical to the card's manual link.
const MANUAL_CONNECT_LINK =
  'https://www.instagram.com/oauth/authorize?client_id=2349711835364274&redirect_uri=https://api.befroosh.app/v1/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments';

const label = (page: InstagramNamespace.Account) =>
  page.username ? `@${page.username}` : page.name;

export const InstagramInvalidDialog = () => {
  const router = useRouter();
  const t = useTranslations('instagramTokenError');
  const [isNavigationLoading, setIsNavigationLoading] = useState(false);

  const { data: instagramPages } = useSWRImmutable<InstagramNamespace.GET['Accounts']>(
    `${API_URL}/instagram/accounts`,
    { revalidateOnMount: true },
  );

  // Same predicate the page cards use, so the banner and the red cards always agree.
  const invalidPages = (instagramPages?.data ?? []).filter((page) => !page.isIgTokenValid);

  if (invalidPages.length === 0) return null;

  const count = invalidPages.length;
  const username = label(invalidPages[0]);
  const usernames = invalidPages.map(label).join('، ');

  const handleReLogin = () => {
    router.push(
      `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${API_URL}/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`,
    );
    setIsNavigationLoading(true);
  };

  return (
    <div className="w-full">
      <div className="border-destructive/30 shadow-destructive/10 mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-2xl border bg-red-50/70 p-6 text-center shadow-sm sm:p-8">
        <div className="bg-destructive/10 text-destructive flex size-14 shrink-0 items-center justify-center rounded-2xl">
          <PlugsIcon size={30} weight="duotone" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-destructive text-base font-bold sm:text-lg">
            {t('banner_title', { count, username, usernames })}
          </h3>
          <p className="text-muted-foreground mx-auto max-w-xl text-[13px] leading-6">
            {t('banner_description', { count, username, usernames })}
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-center">
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
        </div>

        <HelpMeDialog
          title={t('how_to_connect')}
          videoSrc="https://befroosh.s3.ir-thr-at1.arvanstorage.ir/learn%2Ff54e8c002432b82b23a046865a9e9f1067430006-720p.mp4?versionId="
          videoPoster="/images/photo_2025-02-26_22-00-50.jpg"
          noAbsolute
        >
          <Button type="button" variant="link" size="sm" className="text-muted-foreground">
            <TvMinimalPlayIcon className="size-5" />
            {t('how_to_connect')}
          </Button>
        </HelpMeDialog>
      </div>
    </div>
  );
};
