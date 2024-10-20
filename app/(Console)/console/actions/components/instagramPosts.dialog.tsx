"use client";

import { useState, useEffect, MouseEvent } from "react";
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
import InfiniteScroll from "react-infinite-scroll-component";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorMessage from "@/components/ui/errorMessage";

const PAGE_SIZE = 9;

export type InstagramPostsDialogProps = {
  form: any;
  index: number;
  updateContents: any;
  contents: any;
};

const InstagramPostsDialog = ({
  form,
  index,
  updateContents,
  contents,
}: InstagramPostsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [after, setAfter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPosts = async (afterCursor: string | null = null) => {
    setIsLoading(true);
    try {
      const url = afterCursor
        ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/medias/posts?after=${afterCursor}`
        : `${process.env.NEXT_PUBLIC_BACK_API_URL}/medias/posts`;
      const response = await fetch(url, { credentials: "include" });
      const data = await response.json();

      if (!response.ok) {
        console.error("Error fetching posts:", response.statusText);
        return;
      }

      setPosts((prevPosts) => [...prevPosts, ...data.media.data]);
      setHasMore(data.media.data.length === PAGE_SIZE);
      setAfter(data.media.paging.cursors.after || null);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPosts([]);
      setAfter(null);
      fetchPosts();
    }
  }, [isOpen]);

  const selectPost = (e: MouseEvent<HTMLDivElement>) => {
    const postId = e.currentTarget.dataset.postid!;
    const mediaUrl = e.currentTarget.dataset.mediaurl;
    console.log("media", postId, mediaUrl);
    console.log(`value before update`, form?.getValues()?.contents?.[index]);

    updateContents(index, {
      ...contents[index],
      instagramMedia: { image: { url: mediaUrl }, mediaId: postId },
    });
    // form.setValue(`contents.${index}.postId`, postId);
    // form.setValue(`contents.${index}.mediaUrl`, mediaUrl)
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {contents[index].instagramMedia?.image?.url ? (
          <div className="relative w-48 h-48 rounded-lg overflow-hidden">
            <Image
              src={contents[index].instagramMedia.image.url}
              alt="cover"
              fill
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 duration-150 flex justify-center items-center">
              <Button type="button" className="text-white">
                تعویض پست
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-y-2">
            <Button type="button" variant="outline">
              انتخاب پست
            </Button>
            {form?.formState?.errors?.contents?.[index]?.postId && (
              <ErrorMessage>
                {form.formState.errors.contents[index].postId.message}
              </ErrorMessage>
            )}
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[50rem]">
        <DialogHeader>
          <DialogTitle>انتخاب پست</DialogTitle>
          <DialogDescription>
            آخرین پست‌های اینستاگرام خود را مشاهده کنید.
          </DialogDescription>
        </DialogHeader>
        <InfiniteScroll
          dataLength={posts.length}
          next={() => fetchPosts(after)}
          hasMore={hasMore}
          loader={<></>}
          endMessage={<p>پست دیگری موجود نیست.</p>}
          scrollableTarget="scrollableDiv"
        >
          <div
            className="w-full grid grid-cols-3 gap-4"
            id="scrollableDiv"
            style={{ maxHeight: "60vh", overflowY: "auto" }}
          >
            {!posts.length
              ? Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="col-span-1">
                    <Skeleton className="relative w-full h-56" />
                  </div>
                ))
              : Array.isArray(posts) &&
                posts.map((post) => (
                  <div
                    className="relative w-full h-56 col-span-1 bg-black rounded-sm overflow-hidden"
                    key={post.id}
                    data-postid={post.id}
                    data-mediaurl={post.image?.url}
                    onClick={selectPost}
                  >
                    <Image
                      src={post.image?.url}
                      alt={post.caption || "Instagram Post"}
                      layout="fill"
                      objectFit="cover"
                      className="hover:opacity-80 duration-150"
                    />
                  </div>
                ))}
          </div>
        </InfiniteScroll>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>بستن</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramPostsDialog;
