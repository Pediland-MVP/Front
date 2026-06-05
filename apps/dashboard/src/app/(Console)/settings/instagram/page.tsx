"use client";

import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { InstagramAccounts } from "@/components/Settings/InstagramAccounts";
import { InstagramInvalidDialog } from "@/components/Console/InstagramInvalidDialog";
import { Button } from "@/components/ui";
import { usePermissions } from "@/hooks/usePermissions";

const MAX_INSTAGRAM_ACCOUNTS = 5;

export default function Page() {
  const t = useTranslations("Settings.Accounts");
  const t_ec = useTranslations("ERROR_CODES");
  const { can, isLoading: permissionsLoading } = usePermissions();
  const [accountCount, setAccountCount] = useState<number>(0);

  const canView = can("instagram:view");
  const canManage = can("instagram:manage");
  const atLimit = accountCount >= MAX_INSTAGRAM_ACCOUNTS;

  if (permissionsLoading) {
    return (
      <div className="_instagram-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl flex h-[300px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="_instagram-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
        <div className="h-full border-gray-100 px-4 py-5 md:pt-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-primary font-semibold">{t("title")}</h2>
          </div>
          <div className="py-12 text-center text-muted-foreground text-sm border rounded-xl bg-white shadow-xs">
            {t_ec("PERMISSION_DENIED")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="_instagram-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
      <div className="h-full border-gray-100 px-4 py-5 md:pt-0">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-primary font-semibold">{t("title")}</h2>
          <Button size="sm" disabled={atLimit || !canManage} asChild={!atLimit && canManage}>
            {atLimit || !canManage ? (
              <span className="flex items-center gap-1.5">
                <PlusIcon className="size-4" />
                {t("addAccount")}
              </span>
            ) : (
              <Link href="/connect">
                <PlusIcon className="size-4" />
                {t("addAccount")}
              </Link>
            )}
          </Button>
        </div>

        {atLimit && (
          <p className="text-muted-foreground mb-3 text-xs">
            {t("limitReached")}
          </p>
        )}

        <Suspense>
          <div className="flex w-full flex-col items-start justify-center gap-3">
            <InstagramAccounts onCountChange={setAccountCount} />
            <InstagramInvalidDialog />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
