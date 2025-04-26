"use client";

import { useTranslations } from 'next-intl';
import { fetcher } from "@/hooks/swr/fetcher";
import { useEffect, useState } from "react";
import useSWRImmutable, { mutate } from "swr";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { InstagramLogo } from "@phosphor-icons/react";
import { InstagramNamespace } from "@/types/instagram";
import { APIError } from "@/types/apierror";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { Skeleton } from "@/components/ui/skeleton";
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
  const t = useTranslations('Settings.Accounts.SelectInstagram');
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
  const router = useRouter()

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader className="flex justify-center items-start mt-2">
            <DialogTitle className="text-black">
              {t('selectAccount')}
            </DialogTitle>
            <DialogDescription className="text-right">
              {t('accountsDescription')}
            </DialogDescription>
          </DialogHeader>
          <SelectPagesForm facebookAccountId={facebookAccountId} setOpen={setOpen} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader className="">
          <DrawerTitle>{t('selectAccount')}</DrawerTitle>
          <DrawerDescription>
            {t('accountsDescription')}
          </DrawerDescription>
        </DrawerHeader>
        <SelectPagesForm
          facebookAccountId={facebookAccountId}
          className="px-4"
          setOpen={setOpen}
        />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
              <Button variant="outline" onClick={() => router.push('/accounts')}>{t('cancel')}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function SelectPagesForm({
  className,
  facebookAccountId,
  setOpen
}: {
  className?: string;
  facebookAccountId: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const t = useTranslations('SelectPagesForm');
  const [loading, setLoading] = useState<{ id: string }>();
  const router = useRouter()

  const {
    data: instagramPages,
    isLoading: isInstagramPagesLoading,
    error: instagramPagesError,
  } = useSWRImmutable<InstagramNamespace.GET["Pages"] | APIError>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/${facebookAccountId}/instagramPages`,
    fetcher
  );

  useEffect(() => {
    if (!instagramPagesError) return;
    toast({
      title: instagramPagesError?.message,
      description: t('serverConnectionError'),
      variant: "destructive",
    });
  }, [instagramPagesError]);

  const handleSelectInstagram = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    const pageId = e.currentTarget.dataset.id;
    setLoading({ id: pageId! });
    await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/select/${facebookAccountId}/${pageId}`,
      {
        method: "PATCH",
        credentials: "include",
      }
    )
      .then(async (res) => {
        const response = await res.json();
        if (!res.ok) {
          const isExist = response?.message?.includes("already exist");
          toast({
            title: isExist ? t('accountAlreadySelected') : t('serverConnectionError'),
            description: isExist ? t('selectDifferentAccount') : t('serverConnectionError'),
            variant: "destructive",
          });
          return;
        }
        toast({
          title: t('accountSelectedSuccess'),
        });
        await mutate(`${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/accounts`)
        setOpen(false)
        router.push('/accounts')
      })
      .catch((e) => {
        console.error(e);
        toast({
          title: t('serverConnectionError'),
          description: t('serverConnectionError'),
          variant: "destructive",
        });
      })
      .finally(() => setLoading(undefined));
  };

  return (
    <form className={cn(className)}>
      <div className="flex justify-cent items-center gap-x-4 w-full mb-4">
        {isInstagramPagesLoading &&
          Array.from({ length: 2 }).map((_, index) => (
            <Skeleton
              key={index}
              className="flex flex-col gap-y-2 justify-center items-center w-52 h-52 border rounded-lg "
            >
              <Skeleton className="w-20 h-20" />
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-20 h-8 rounded" />
            </Skeleton>
          ))}
        {Array.isArray(instagramPages) &&
          instagramPages?.map((instagram) => {
            return (
              <div
                key={instagram.id}
                className="flex flex-col gap-y-2 justify-center items-center px-4 w-52 h-52 border rounded-lg"
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
                  className="w-full text-black flex justify-center items-center gap-x-2"
                  variant={"outline"}
                >
                  {t('select')}
                  {loading?.id === instagram.id && <LoadingSpinner size={20} />}
                </Button>
              </div>
            );
          })}
      </div>
    </form>
  );
}

