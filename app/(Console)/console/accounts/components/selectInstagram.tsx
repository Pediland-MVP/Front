import { fetcher } from "@/hooks/swr/fetcher";
import { useEffect, useState } from "react";
import useSWRImmutable, { mutate } from "swr";

export type SelectInstagramProps = {
  facebookAccountId: string;
};

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
import { sleep } from "@/app/utils/sleep";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type DrawerDialogDemoProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  facebookAccountId: string;
};

export function DrawerDialogDemo({
  open,
  setOpen,
  facebookAccountId,
}: DrawerDialogDemoProps) {
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
  const router = useRouter()

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader className="flex justify-center items-start mt-2">
            <DialogTitle className="text-black">
              یک اکانت انتخاب کنید
            </DialogTitle>
            <DialogDescription className="text-right">
              این اکانت‌های اینستاگرام به حساب فیسبوک شما متصل هستند. شما
              میتوانید یکی را انتخاب کنید
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
          <DrawerTitle>یک اکانت انتخاب کنید</DrawerTitle>
          <DrawerDescription>
            این اکانت‌های اینستاگرام به حساب فیسبوک شما متصل هستند. شما میتوانید
            یکی را انتخاب کنید
          </DrawerDescription>
        </DrawerHeader>
        <SelectPagesForm
          facebookAccountId={facebookAccountId}
          className="px-4"
          setOpen={setOpen}
        />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
              <Button variant="outline" onClick={() => router.push('/console/accounts')}>انصراف</Button>
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
      description: "ارتباط با سرور برقرار نشد",
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
            title: isExist
              ? "این اکانت قبلا انتخاب شده است"
              : "ارتباط با سرور برقرار نشد",
            description: isExist
              ? "اکانت دیگری انتخاب کنید"
              : "ارتباط با سرور برقرار نشد",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: 'اکانت با موفقیت انتخاب شد',
        });
        await mutate(`${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/accounts`)
        setOpen(false)
        router.push('/console/accounts')
      })
      .catch((e) => {
        console.error(e);
        toast({
          title: "ارتباط با سرور برقرار نشد",
          description: "ارتباط با سرور برقرار نشد",
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
                  انتخاب
                  {loading?.id === instagram.id && <LoadingSpinner size={20} />}
                </Button>
              </div>
            );
          })}
      </div>
    </form>
  );
}
