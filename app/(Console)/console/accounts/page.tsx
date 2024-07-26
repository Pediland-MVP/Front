"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/hooks/swr/fetcher";
import { ResizablePanel } from "@/registry/new-york/ui/resizable";
import { Separator } from "@/registry/new-york/ui/separator";
import { InstagramNamespace } from "@/types/instagram";
import { InstagramLogo, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { DrawerDialogDemo } from "./selectInstagram";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function AccountPage() {

  const searchParams = useSearchParams()
  const isFromFacebook: boolean = !!searchParams.get('facebookAccountId')
  

  const {
    data: instagramPages,
    isLoading: isInstagramPagesLoading,
    error: instagramPagesError,
  } = useSWR<InstagramNamespace.GET["Accounts"]>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/accounts`,
    fetcher,
    {
      refreshInterval: 0,
    }
  );

  const filteredInstagramPages = isFromFacebook ? instagramPages?.filter(page => page.facebookAccountId === searchParams.get('facebookAccountId') && !page.instagramId) : instagramPages?.filter((account) => account.instagramId);

  const [openSelectInstagramDialog, setOpenSelectInstagramDialog] =
    useState<boolean>(false);
  const [facebookAccountId, setFacebookAccountId] = useState<string>();

  const defaultLayout = [20, 32, 48];
  return (
    <ResizablePanel
      defaultSize={80}
      minSize={30}
      // className="px-4"
    >
      <div className="flex justify-start items-center h-14 px-4">
        <h1 className="text-xl font-bold">اکانت های کاربری</h1>
      </div>
      <Separator className="mb-6" />

      <div className="mb-6">
        <Link
          target="_blank"
          href={`${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/connectFB`}
        >
          <Button className="gap-x-1">
            <Plus size={15} />
            افزودن اکانت
          </Button>
        </Link>
      </div>

      <div className="flex justify-start items-start flex-wrap gap-4 w-full">
        {isInstagramPagesLoading &&
          Array.from({ length: 10 }).map((_, index) => (
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

        {filteredInstagramPages
          ?.map((instagram) => {
            return (
              <div
                key={instagram.id}
                className="flex flex-col gap-y-2 justify-center items-center w-52 h-52 border rounded-lg "
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
                {instagram.instagramId ? (
                  <Link href={`https://instagram.com/${instagram.username}`} target="_blank">
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
              </div>
            );
          })}

        <DrawerDialogDemo
          facebookAccountId={facebookAccountId!}
          open={openSelectInstagramDialog}
          setOpen={setOpenSelectInstagramDialog}
        />
      </div>
    </ResizablePanel>
    //   <ResizableHandle withHandle />
  );
}
