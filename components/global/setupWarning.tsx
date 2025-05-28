"use client";

import { Basket, WarningCircle, Plug } from "@phosphor-icons/react/dist/ssr";

import { useSidebar } from "@/components/theme/ui/sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useUser from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface SetupWarningProps {
    subscriptionWarningText?: string
    instagramWarningText?: string
}

export function SetupWarning({ instagramWarningText, subscriptionWarningText }: SetupWarningProps) {
  const { hasInstagram, hasSubscription } = useUser();
  const { isMobile, setOpenMobile } = useSidebar();
  const t = useTranslations('SetupWarning')

  return (
    <>
      {!hasSubscription || !hasInstagram ? (
        <div
          className={cn(
            `col-span-4 flex flex-col items-center justify-center gap-2 text-white pt-2 p-3 mx-2 text-sm rounded-md`,
            !hasSubscription ? "bg-red-500/90" : "bg-orange-500/90"
          )}
        >
          <div className="flex items-center xl:flex-col gap-2">
            <div>
              <WarningCircle size={28} weight="duotone" />
            </div>
            {!hasSubscription ? (
              <p>
                {
                    subscriptionWarningText || t('subscriptionWarningText')
                }
              </p>
            ) : (
              <p>
                {
                    instagramWarningText || t('instagramWarningText')
                }
              </p>
            )}
          </div>
          <Button
            className="w-full bg-sidebar hover:bg-blue-100 text-black"
            asChild
          >
            <Link
              href={
                !hasSubscription ? "/settings/upgrade" : "/settings/instagram"
              }
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
            >
              {!hasSubscription ? (
                <>
                  <Basket weight="duotone" />
                  خرید اشتراک
                </>
              ) : (
                <>
                  <Plug weight="duotone" />
                  اتصال اکانت
                </>
              )}
            </Link>
          </Button>
        </div>
      ) : null}
    </>
  );
}
