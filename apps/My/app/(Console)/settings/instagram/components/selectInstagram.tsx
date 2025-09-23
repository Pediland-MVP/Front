"use client";

import { useTranslations } from "next-intl";
import { fetcher } from "@/hooks/swr/fetcher";
import { useEffect, useState } from "react";
import useSWRImmutable, { mutate } from "swr";
import * as React from "react";
import { cn } from "@befroosh/ui";
import { Button } from "@befroosh/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@befroosh/ui";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@befroosh/ui";
import { InstagramLogo } from "@phosphor-icons/react";
import { InstagramNamespace } from "@/types/instagram";
import { APIError } from "@/types/apierror";
import Image from "next/image";
import { toast } from "sonner";
import { LoaderSpin } from "@befroosh/ui-custom";
import { Skeleton } from "@befroosh/ui";
import { useRouter } from "next/navigation";

export type DrawerDialogDemoProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  facebookAccountId: string;
};

export function SelectInstagram({
  open,
  setOpen,
  facebookAccountId,
}: DrawerDialogDemoProps) {
  const t = useTranslations("Settings.Accounts.SelectInstagram");
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
  const router = useRouter();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader className="mt-2 flex items-start justify-center">
            <DialogTitle className="text-black">
              {t("selectAccount")}
            </DialogTitle>
            <DialogDescription className="text-right">
              {t("accountsDescription")}
            </DialogDescription>
          </DialogHeader>
          <SelectPagesForm
            facebookAccountId={facebookAccountId}
            setOpen={setOpen}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader className="">
          <DrawerTitle>{t("selectAccount")}</DrawerTitle>
          <DrawerDescription>{t("accountsDescription")}</DrawerDescription>
        </DrawerHeader>
        <SelectPagesForm
          facebookAccountId={facebookAccountId}
          className="px-4"
          setOpen={setOpen}
        />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline" onClick={() => router.push("/accounts")}>
              {t("cancel")}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function SelectPagesForm({
  className,
  facebookAccountId,
  setOpen,
}: {
  className?: string;
  facebookAccountId: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const t = useTranslations("SelectPagesForm");
  const [loading, setLoading] = useState<{ id: string }>();
  const router = useRouter();

  const {
    data: instagramPages,
    isLoading: isInstagramPagesLoading,
    error: instagramPagesError,
  } = useSWRImmutable<InstagramNamespace.GET["Pages"] | APIError>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/${facebookAccountId}/instagramPages`,
    fetcher,
  );

  useEffect(() => {
    if (!instagramPagesError) return;
    toast.error(instagramPagesError?.message);
  }, [instagramPagesError]);

  const handleSelectInstagram = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    const pageId = e.currentTarget.dataset.id;
    setLoading({ id: pageId! });
    await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/select/${facebookAccountId}/${pageId}`,
      {
        method: "PATCH",
        credentials: "include",
      },
    )
      .then(async (res) => {
        const response = await res.json();
        if (!res.ok) {
          const isExist = response?.message?.includes("already exist");
          toast(
            isExist ? t("accountAlreadySelected") : t("serverConnectionError"),
          );
          return;
        }
        toast(t("accountSelectedSuccess"));
        await mutate(
          `${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/accounts`,
        );
        setOpen(false);
        router.push("/accounts");
      })
      .catch((e) => {
        console.error(e);
        toast(t("serverConnectionError"));
      })
      .finally(() => setLoading(undefined));
  };

  return (
    <form className={cn(className)}>
      <div className="justify-cent mb-4 flex w-full items-center gap-x-4">
        {isInstagramPagesLoading &&
          Array.from({ length: 2 }).map((_, index) => (
            <Skeleton
              key={index}
              className="flex h-52 w-52 flex-col items-center justify-center gap-y-2 rounded-lg border"
            >
              <Skeleton className="h-20 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-20 rounded" />
            </Skeleton>
          ))}
        {Array.isArray(instagramPages) &&
          instagramPages?.map((instagram) => {
            return (
              <div
                key={instagram.id}
                className="flex h-52 w-52 flex-col items-center justify-center gap-y-2 rounded-lg border px-4"
              >
                {instagram.profile_picture_url ? (
                  <Image
                    className="rounded-full"
                    src={instagram.profile_picture_url}
                    width={70}
                    height={70}
                    alt={instagram.name}
                  />
                ) : (
                  <InstagramLogo size={70} />
                )}
                <p>{instagram.name}</p>
                <p>{instagram.username}</p>
                <Button
                  onClick={handleSelectInstagram}
                  data-id={instagram.id}
                  className="flex w-full items-center justify-center gap-x-2 text-black"
                  variant={"outline"}
                >
                  {t("select")}
                  {loading?.id === instagram.id && <LoadingSpinner size={20} />}
                </Button>
              </div>
            );
          })}
      </div>
    </form>
  );
}
