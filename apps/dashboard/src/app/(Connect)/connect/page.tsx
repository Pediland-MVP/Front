'use client';

import { useLogout } from '@/hooks/swr/api-client';
import useConnectInstagram from '@/hooks/useConnectInstagram';
import useUser from '@/hooks/useUser';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePermissions } from '@/hooks/usePermissions';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { HelpMeDialog } from '@/components/Global/HelpMeDialog';
import { LogoSlogan } from '@/components/Global/LogoSlogan';
import { LogoText } from '@/components/Global/LogoText';
import { WorkspaceSwitcherDialog } from '@/components/Console/WorkspaceSwitcherDialog';
import { Button, Spinner } from '@/components/ui';
import { HowToConnectDialog } from '@components/Connect/HowToConnectDialog';
import { HeadsetIcon, PlugsIcon, SignOutIcon, ArrowsLeftRight } from '@phosphor-icons/react';
import {
  ClipboardCopyIcon,
  CopyIcon,
  PlayIcon,
  SquarePlayIcon,
  TvMinimalPlayIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SITE_URL = process.env.NEXT_PUBLIC_LANDING_URL;
const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const INSTAGRAM_CLIENT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

export default function ConnectPage() {
  const t = useTranslations('Connect');
  const locale = useLocale();
  const router = useRouter();

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState<boolean>(false);

  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const { callbackIG, isCallbackIGLoading } = useConnectInstagram();
  const logout = useLogout();
  const { user, hasInstagram, canConnectInstagram } = useUser();
  const { workspaces } = useWorkspaces();
  const { workspaceId, can, isLoading: isPermissionsLoading } = usePermissions();
  // While workspaceId is set but the effective-permissions fetch hasn't resolved yet,
  // `can()` reads an empty permission set and would report "not granted" even for an
  // owner/member who actually has instagram:manage — wait for the fetch instead.
  const isCheckingPermission = Boolean(workspaceId) && isPermissionsLoading;
  const canConnect = canConnectInstagram && (workspaceId ? can('instagram:manage') : true);
  const currentWorkspace = workspaces.find((w) => w.id === workspaceId);
  const instagramCount = user?.instagrams?.length ?? 0;
  const atInstagramLimit = instagramCount >= 5;

  useEffect(() => {
    const submitCode = async (code: string) => {
      await callbackIG(code);
    };

    if (code) {
      submitCode(code);
    }
  }, [searchParams]);

  const logoutHandler = async () => {
    setIsLogoutLoading(true);

    try {
      await logout();
      router.replace('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLogoutLoading(false);
    }
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between gap-4 px-4 text-white">
        <div className="flex items-center gap-4">
          {isLogoutLoading ? (
            <Spinner className="size-6" />
          ) : (
            <SignOutIcon
              size={26}
              onClick={logoutHandler}
              className={cn('cursor-pointer', locale !== 'fa' && 'rotate-180')}
            />
          )}

          <Link
            href="/support"
            target="_blank"
            className="flex items-center gap-2 md:justify-center"
          >
            <HeadsetIcon size={28} weight="duotone" />
            <span className="text-sm">{t('support')}</span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          {locale === 'fa' && <LogoSlogan variant="white" />}
          <LogoText variant="white" size="sm" />
        </div>
      </header>

      <div className="flex-1 rounded-t-3xl bg-violet-50 py-6">
        <HowToConnectDialog open={isDialogOpen} setOpen={setDialogOpen} />

        <div className="container mx-auto flex h-full flex-col justify-around px-5 md:max-w-sm">
          <div className="flex flex-col items-center space-y-4">
            <PlugsIcon size={60} weight="duotone" className="text-secondary" />

            <div className="space-y-3">
              <p className="text-center font-medium">
                {t('title1')}
                <br />
                {t('title2')}
              </p>
              <div className="flex flex-col items-center text-[15px]">
                <div className="text-muted-foreground">
                  {t('mobile')} <span className="text-secondary font-semibold">{user?.mobile}</span>
                </div>
                {currentWorkspace && (
                  <div className="text-muted-foreground mt-1 flex items-center gap-1.5">
                    <span>{locale === 'fa' ? 'فضای کاری:' : 'Workspace:'}</span>
                    <span className="text-secondary font-semibold">{currentWorkspace.name}</span>
                    <WorkspaceSwitcherDialog
                      trigger={
                        <button className="text-primary flex cursor-pointer items-center gap-0.5 border-0 bg-transparent p-0 text-xs font-bold hover:underline">
                          <ArrowsLeftRight size={14} className="inline" />
                          <span>{locale === 'fa' ? 'تغییر' : 'Change'}</span>
                        </button>
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col items-center justify-center">
              {atInstagramLimit ? (
                <div className="w-full rounded-xl bg-violet-50 px-4 py-3 text-center text-sm text-violet-700">
                  {t('instagram_limit')}
                </div>
              ) : isCheckingPermission ? (
                <div className="flex w-full items-center justify-center py-4">
                  <Spinner className="size-6" />
                </div>
              ) : !canConnect ? (
                // Sub-scenario B.2 — member lacks instagram:manage permission.
                // Backend already blocks the connect; this surfaces the reason in the UI.
                <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-center text-sm text-amber-800">
                  <p className="mb-1 font-medium">{t('no_connect_permission_title')}</p>
                  <p className="text-xs">{t('no_connect_permission_description')}</p>
                </div>
              ) : (
                <>
                  <Button className="w-full" disabled={isCallbackIGLoading} asChild>
                    <Link
                      href={`https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${API_URL}/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`}
                    >
                      {isCallbackIGLoading ? (
                        <>
                          <Spinner className="size-5" /> {t('connecting_account')}
                        </>
                      ) : (
                        t('connect_account')
                      )}
                    </Link>
                  </Button>
                  <Button
                    variant="link"
                    className="text-muted-foreground mt-4 text-sm font-normal"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        'https://www.instagram.com/oauth/authorize?client_id=2349711835364274&redirect_uri=https://api.befroosh.app/v1/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments',
                      );
                      toast.success('لینک اتصال با موفقیت کپی شد!');
                    }}
                  >
                    {t('copy_manual')}
                    <CopyIcon />
                  </Button>
                </>
              )}

              <HelpMeDialog
                helpId="connect_instagram"
                title={t('how_to_connect')}
                videoSrc="https://befroosh.s3.ir-thr-at1.arvanstorage.ir/learn%2Ff54e8c002432b82b23a046865a9e9f1067430006-720p.mp4?versionId="
                videoPoster="/images/photo_2025-02-26_22-00-50.jpg"
                noAbsolute
              >
                <Button
                  type="button"
                  variant="link"
                  size="lg"
                  className="text-muted-foreground mt-4"
                >
                  <TvMinimalPlayIcon className="size-6" />
                  {t('how_to_connect')}
                </Button>
              </HelpMeDialog>

              {hasInstagram && (
                <Button variant="outline" className="mt-4 w-full" asChild>
                  <Link href="/">{t('back_to_home')}</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="mx-auto mb-24 flex flex-col items-center">
            <div className="mx-auto mb-4 flex items-center justify-center gap-4">
              <Image
                src="/images/logo-threads.svg"
                alt="Threads Logo"
                className="h-7"
                width={28}
                height={28}
              />
              <Image
                src="/images/logo-instagram.svg"
                alt="Instagram Logo"
                className="h-7 w-auto"
                width={28}
                height={28}
              />
              <Image
                src="/images/logo-meta.svg"
                alt="Meta Logo"
                className="h-6"
                width={120}
                height={24}
              />
            </div>

            <p className="mb-2 text-center">
              {t.rich('befroosh_meta_partner', {
                bold: (chunks) => <strong>{chunks}</strong>,
                span: (chunks) => <span className="text-sm">{chunks}</span>,
              })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
