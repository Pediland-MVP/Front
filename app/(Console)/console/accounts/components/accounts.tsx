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
    }
  );

  const filteredInstagramPages = isFromFacebook
    ? instagramPages?.filter(
        (page) =>
          page.facebookAccountId === searchParams.get("facebookAccountId") &&
          !page.instagramId
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
        }
      );

      if (!response.ok) {
        toast({
          title: "خطایی پیش امد",
          variant: "destructive",
        });
        return;
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
      {/* <div className="w-full mb-6 px-4">
        <Button
          className=""
          disabled={(filteredInstagramPages?.length || 0) > 0}
        ></Button>
      </div> */}

      {isInstagramPagesLoading &&
        Array.from({ length: 10 }).map((_, index) => (
          <Skeleton
            key={index}
            className="flex flex-col gap-4 justify-center items-center w-full h-52 border rounded-lg "
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
            className="_card bg-white shadow-md rounded-lg"
          >
            <div className="flex flex-col items-center justify-center gap-4 p-5 group h-full hover:cursor-pointer">
              <div>
                {instagram.profilePictureUrl ? (
                  <Image
                    className="rounded-full"
                    src={instagram.profilePictureUrl}
                    width={75}
                    height={75}
                    alt={instagram.name}
                  />
                ) : (
                  <InstagramLogo size={75} />
                )}
              </div>

              <div className="flex flex-col justify-center items-center">
                <span>{instagram.name}</span>
                <span className="text-[15px] text-gray-500">
                  {instagram.username}@
                </span>
              </div>

              <div className="flex gap-2">
                {instagram.instagramId ? (
                  <Link
                    href={`https://instagram.com/${instagram.username}`}
                    target="_blank"
                  >
                    <Button variant={"outline"}>مشاهده اکانت</Button>
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
                      <Trash size={20} />
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
          </div>
        );
      })}

      <DrawerDialogDemo
        facebookAccountId={facebookAccountId!}
        open={openSelectInstagramDialog}
        setOpen={setOpenSelectInstagramDialog}
      />

      <div className="_card bg-white hover:shadow-md rounded-lg duration-300">
        <div
          className="flex flex-col items-center justify-center gap-3 p-5 group h-full hover:cursor-pointer"
          onClick={() =>
            router.push(
              `${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/connectIG`
            )
          }
        >
          <Plus
            size={28}
            className="text-gray-400 group-hover:text-black duration-300"
          />
          <span className="font-medium text-gray-400 group-hover:text-black duration-300">
            افزودن اکانت
          </span>
        </div>
      </div>
    </>
  );
}
