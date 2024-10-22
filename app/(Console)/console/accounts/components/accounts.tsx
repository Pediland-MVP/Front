"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/hooks/swr/fetcher";
import { Separator } from "@/registry/new-york/ui/separator";
import { InstagramNamespace } from "@/types/instagram";
import { InstagramLogo, Plus, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { DrawerDialogDemo } from "./selectInstagram";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Accounts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromFacebook: boolean = !!searchParams.get("facebookAccountId");

  const {
    data: instagramPages,
    isLoading: isInstagramPagesLoading,
    error: instagramPagesError,
    mutate,
  } = useSWR<InstagramNamespace.GET["Accounts"]>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/accounts`,
    fetcher,
    {
      refreshInterval: 0,
    },
  );

  const filteredInstagramPages = isFromFacebook
    ? instagramPages?.filter(
        (page) =>
          page.facebookAccountId === searchParams.get("facebookAccountId") &&
          !page.instagramId,
      )
    : !!instagramPages?.length
      ? instagramPages.filter((account) => account.instagramId)
      : null;

  useEffect(() => {
    if (isFromFacebook) {
      if (filteredInstagramPages?.length === 0) {
        toast({
          title: "خطایی پیش آمد",
          description: "لطفا دوباره امتحان کنید",
        });
        router.push("/console/accounts");
        return;
      }
      setOpenSelectInstagramDialog(true);
    }
  }, [filteredInstagramPages]);

  const [openSelectInstagramDialog, setOpenSelectInstagramDialog] =
    useState<boolean>(false);
  const [facebookAccountId, setFacebookAccountId] = useState<string>();

  useEffect(() => {
    if (isFromFacebook) {
      setFacebookAccountId(searchParams.get("facebookAccountId")!);
    }
  }, [filteredInstagramPages]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        toast({
          title: "خطایی پیش امد",
        });
      }

      toast({
        title: "حذف موفق",
        description: "اکانت با موفقیت حذف شد",
      });

      mutate(); // Refresh the data
    } catch (error) {
      toast({
        title: "خطا در حذف",
        description: "مشکلی در حذف اکانت پیش آمد. لطفا دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex justify-start items-center h-14 px-4">
        <h1 className="text-xl font-bold">اکانت های کاربری</h1>
      </div>
      <Separator className="mb-6" />

      <div className="w-full mb-6 px-4">
        <Button
          onClick={() =>
            router.push(
              `${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/connectIG`,
            )
          }
          className="gap-x-1 w-full lg:w-auto"
          disabled={(filteredInstagramPages?.length || 0) > 0}
        >
          <Plus size={15} />
          افزودن اکانت
        </Button>
      </div>

      <div className="flex justify-start items-start flex-wrap gap-4 px-4 w-full">
        {isInstagramPagesLoading &&
          Array.from({ length: 10 }).map((_, index) => (
            <Skeleton
              key={index}
              className="flex flex-col gap-y-2 justify-center items-center w-full lg:w-52 h-52 border rounded-lg "
            >
              <Skeleton className="w-20 h-20" />
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-20 h-8 rounded" />
            </Skeleton>
          ))}

        {filteredInstagramPages?.map((instagram) => {
          return (
            <div
              key={instagram.id}
              className="flex flex-col gap-y-2 justify-center items-center w-full lg:w-52 h-52 border rounded-lg "
            >
              {instagram.profilePictureUrl ? (
                <Image
                  className="rounded-full"
                  src={instagram.profilePictureUrl}
                  width={70}
                  height={70}
                  alt={instagram.name}
                />
              ) : (
                <InstagramLogo size={70} />
              )}
              <p>{instagram.name}</p>
              <p>{instagram.username}</p>
              <div className="flex gap-2">
                {instagram.instagramId ? (
                  <Link
                    href={`https://instagram.com/${instagram.username}`}
                    target="_blank"
                  >
                    <Button variant={"outline"}>دیدن اکانت</Button>
                  </Link>
                ) : (
                  <Button
                    onClick={() => {
                      setOpenSelectInstagramDialog(true);
                      setFacebookAccountId(instagram.facebookAccountId);
                    }}
                    variant={"outline"}
                  >
                    اتصال به اکانت
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash size={16} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        این عمل قابل بازگشت نیست. این اکانت از لیست شما حذف
                        خواهد شد.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>انصراف</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(instagram.id)}
                      >
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}

        <DrawerDialogDemo
          facebookAccountId={facebookAccountId!}
          open={openSelectInstagramDialog}
          setOpen={setOpenSelectInstagramDialog}
        />
      </div>
    </>
  );
}
