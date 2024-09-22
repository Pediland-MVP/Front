'use client'
import { useState } from "react";
import useSWRInfinite from "swr/infinite";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetcher } from "@/hooks/swr/fetcher";


const PAGE_SIZE = 40;

const getKey = (pageIndex: number, previousPageData: any) => {
  if (previousPageData && !previousPageData.paging.cursors.after) return null; // reached the end
  if (pageIndex === 0) return `http://localhost:3001/v1/medias/posts`; // initial request
  return `http://localhost:3001/v1/medias/posts?after=${previousPageData.paging.cursors.after}`; // pagination
};

const InstagramPostsDialog = () => {
  const { data, error, size, setSize } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
  });
  const [isOpen, setIsOpen] = useState(false);

  const posts = data ? data.flatMap((page) => page.media.data) : [];
  const isLoadingInitialData = !data && !error;
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 && data && typeof data[size - 1] === "undefined");
  const isReachingEnd =
    data && data[data.length - 1]?.media?.data?.length < PAGE_SIZE;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">انتخاب پست</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>انتخاب پست</DialogTitle>
          <DialogDescription>
            آخرین پست‌های اینستاگرام خود را مشاهده کنید.
          </DialogDescription>
        </DialogHeader>
        <div
          className="grid gap-4 py-4"
          style={{
            gridTemplateColumns: "repeat(6, 1fr)",
            overflowY: "scroll",
            maxHeight: "60vh",
          }}
          onScroll={(e) => {
            const bottom =
              e.currentTarget.scrollHeight - e.currentTarget.scrollTop ===
              e.currentTarget.clientHeight;
            if (bottom && !isLoadingMore && !isReachingEnd) {
              setSize(size + 1);
            }
          }}
        >
          {posts.map((post, index) => (
            <div key={post.id} className="col-span-1">
              {post.media_type === "VIDEO" ? (
                <Image
                  src={post.thumbnail_url}
                  alt={post.caption || "Instagram Post"}
                  width={100}
                  height={100}
                />
              ) : (
                <Image
                  src={post.media_url}
                  alt={post.caption || "Instagram Post"}
                  width={100}
                  height={100}
                />
              )}
            </div>
          ))}
        </div>
        {isLoadingMore && <p>در حال بارگذاری...</p>}
        {isReachingEnd && <p>پست دیگری موجود نیست.</p>}
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>بستن</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramPostsDialog;
