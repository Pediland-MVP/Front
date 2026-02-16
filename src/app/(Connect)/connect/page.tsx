"use client";

import { useLogout } from "@/hooks/swr/api-client";
import useConnectInstagram from "@/hooks/useConnectInstagram";
import useUser from "@/hooks/useUser";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { HelpMeDialog } from "@/components/Global/HelpMeDialog";
import { LogoSlogan } from "@/components/Global/LogoSlogan";
import { LogoText } from "@/components/Global/LogoText";
import { Button, Spinner } from "@/components/ui";
import { HowToConnectDialog } from "@components/Connect/HowToConnectDialog";
import { HeadsetIcon, PlugsIcon, SignOutIcon } from "@phosphor-icons/react";
import {
  ClipboardCopyIcon,
  CopyIcon,
  PlayIcon,
  SquarePlayIcon,
  TvMinimalPlayIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_LANDING_URL;
const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const INSTAGRAM_CLIENT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

export default function ConnectPage() {
  const t = useTranslations("Connect");
  const locale = useLocale();
  const router = useRouter();

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState<boolean>(false);

  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const { callbackIG, isCallbackIGLoading } = useConnectInstagram();
  const logout = useLogout();
  const { user, hasInstagram } = useUser();

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
      router.replace("/auth");
    } catch (error) {
      console.error("Logout error:", error);
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
              className={cn("cursor-pointer", locale !== "fa" && "rotate-180")}
            />
          )}

          <Link
            href="/support"
            target="_blank"
            className="flex items-center gap-2 md:justify-center"
          >
            <HeadsetIcon size={28} weight="duotone" />
            <span className="text-sm">{t("support")}</span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          {locale === "fa" && <LogoSlogan variant="white" />}
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
                {t("title1")}
                <br />
                {t("title2")}
              </p>
              <div className="flex flex-col items-center text-[15px]">
                <div className="text-muted-foreground">
                  {t("mobile")}{" "}
                  <span className="text-secondary font-semibold">
                    {user?.mobile}
                  </span>
                </div>
                {user?.submittedInstagramUsername && (
                  <div className="text-muted-foreground">
                    {t("instagram")}{" "}
                    <span className="text-secondary font-semibold">
                      {user?.submittedInstagramUsername}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full flex flex-col  justify-center items-center">
              <Button
                className="w-full"
                // onClick={() => setDialogOpen(true)}
                disabled={isCallbackIGLoading}
                asChild
              >
                <Link
                  href={`https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${API_URL}/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`}
                >
                  {isCallbackIGLoading ? (
                    <>
                      <Spinner className="size-5" /> {t("connecting_account")}
                    </>
                  ) : (
                    t("connect_account")
                  )}
                </Link>
              </Button>
              <Button
                variant="link"
                className="text-muted-foreground mt-4 text-sm font-normal"
                onClick={() => {
                  navigator.clipboard.writeText(
                    "https://www.instagram.com/oauth/authorize?client_id=2349711835364274&redirect_uri=https://api.befroosh.app/v1/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments",
                  );
                  toast.success("لینک اتصال با موفقیت کپی شد!");
                }}
              >
                {t("copy_manual")}
                <CopyIcon />
              </Button>
            </div>
          </div>

          <HelpMeDialog
            title={t("how_to_connect")}
            videoSrc="https://befroosh.s3.ir-thr-at1.arvanstorage.ir/learn%2Ff54e8c002432b82b23a046865a9e9f1067430006-720p.mp4?versionId="
            videoPoster="/images/photo_2025-02-26_22-00-50.jpg"
            noAbsolute
          >
            <Button
              type="button"
              variant="link"
              size="lg"
              className="text-muted-foreground"
            >
              <TvMinimalPlayIcon className="size-6" />
              {t("how_to_connect")}
            </Button>
          </HelpMeDialog>

          <div className="mx-auto flex flex-col items-center">
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
              {t.rich("befroosh_meta_partner", {
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
