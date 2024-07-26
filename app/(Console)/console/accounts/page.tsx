"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/hooks/swr/fetcher";
import { Card } from "@/registry/new-york/ui/card";
import { ResizablePanel } from "@/registry/new-york/ui/resizable";
import { Separator } from "@/registry/new-york/ui/separator";
import { InstagramNamespace } from "@/types/instagram";
import { InstagramLogo, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect } from "react";
import useSWR from "swr";

export default function AccountPage() {
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

  const defaultLayout = [20, 32, 48];
  return (
    <ResizablePanel
      defaultSize={defaultLayout[1]}
      minSize={30}
      className="px-4"
    >
      <div className="flex justify-start items-center px-4 py-2">
        <h1 className="text-xl font-bold">حساب های کاربری</h1>
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
        {isInstagramPagesLoading && Array.from({length: 10}).map((_, index) => (
          <Skeleton key={index} className="flex flex-col gap-y-2 justify-center items-center w-52 h-52 border rounded-lg ">
            <Skeleton className="w-20 h-20" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-20 h-8 rounded" />
          </Skeleton>
        ))}

        {instagramPages
          ?.filter((account) => !account.instagramId)
          .map((instagram) => {
            return (
              <div key={instagram.id} className="flex flex-col gap-y-2 justify-center items-center w-52 h-52 border rounded-lg ">
                <InstagramLogo size={70} />
                <p>{instagram.name}</p>
                <p>{instagram.username}</p>
                <Button variant={"outline"}>اتصال به حساب</Button>
              </div>
            );
          })}
      </div>
    </ResizablePanel>
    //   <ResizableHandle withHandle />
  );
}
