"use client";

import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { InstagramAccounts } from "@/components/Settings/InstagramAccounts";
import { InstagramInvalidDialog } from "@/components/Console/InstagramInvalidDialog";
import { Button } from "@/components/ui";

const MAX_INSTAGRAM_ACCOUNTS = 5;

export default function Page() {
  const t = useTranslations("Settings.Accounts");
  const [accountCount, setAccountCount] = useState<number>(0);

  const atLimit = accountCount >= MAX_INSTAGRAM_ACCOUNTS;

  return (
    <div className="_instagram-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
      <div className="h-full border-gray-100 px-4 py-5 md:pt-0">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-primary font-semibold">{t("title")}</h2>
          <Button size="sm" disabled={atLimit} asChild={!atLimit}>
            {atLimit ? (
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
