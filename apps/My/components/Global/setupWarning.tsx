"use client";

import useUser from "@/hooks/useUser";
import { cn } from "@befroosh/lib";
import { useTranslations } from "next-intl";
import Link from "next/link";

// UI Imports
import { useSidebar } from "@befroosh/ui";
import { Button } from "@befroosh/ui";
import { PlugIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

interface SetupWarningProps {
  subscriptionWarningText?: string;
  instagramWarningText?: string;
}

export function SetupWarning({
  instagramWarningText,
  subscriptionWarningText,
}: SetupWarningProps) {
  const { hasInstagram, isLoading } = useUser();
  const { isMobile, setOpenMobile } = useSidebar();
  const t = useTranslations("SetupWarning");

  if (isLoading) return null;

  return (
    <>
      {!hasInstagram ? (
        <div
          className={cn(
            `col-span-4 flex flex-col items-center justify-center gap-2 rounded-md bg-orange-500/90 p-3 pt-2 text-sm text-white`,
          )}
        >
          <div className="flex items-center gap-2 xl:flex-col">
            <div>
              <WarningCircleIcon size={28} weight="duotone" />
            </div>

            <p>{instagramWarningText || t("instagramWarningText")}</p>
          </div>
          <Button
            className="bg-sidebar w-full text-black hover:bg-blue-100"
            asChild
          >
            <Link
              href={"/settings/instagram"}
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
            >
              <>
                <PlugIcon weight="duotone" />
                اتصال اکانت
              </>
            </Link>
          </Button>
        </div>
      ) : null}
    </>
  );
}
