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
import {
  Control,
  useFieldArray,
  useFormContext,
  UseFormGetValues,
  UseFormStateReturn,
} from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../content-cycle/components/contentCycle";
import { useTranslations } from "next-intl";
import { ContentCycleContentModeEnum } from "@/app/constants/contentCycleContent.enum";
import api from "@/hooks/swr/api-client";
import { AxiosError } from "axios";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { toast } from "@/components/theme/ui/use-toast";

const PAGE_SIZE = 9;

export type InstagramPostsDialogProps = {
  index: number;
  mode: ContentCycleContentModeEnum;
};

const InstagramPostsDialog = ({ index, mode }: InstagramPostsDialogProps) => {
  const {
    getValues,
    control,
    formState: { errors },
  } = useFormContext<z.infer<typeof contentCycleFormSchema>>();

  const { fields: contents, update: updateContents } = useFieldArray({
    control: control,
    name:
      mode === ContentCycleContentModeEnum.REMINDER ? "reminders" : "contents",
    keyName: "_xid",
  });

  const [isOpen, setIsOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [after, setAfter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPosts = async (afterCursor: string | null = null) => {
    setIsLoading(true);
    await api
      .get(
        afterCursor
          ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/posts/pure?after=${afterCursor}`
          : `${process.env.NEXT_PUBLIC_BACK_API_URL}/posts/pure`
      )
      .then(async (res) => {
        setPosts((prevPosts) => [...prevPosts, ...res.data.media.data]);
        setHasMore(res.data.media.data.length === PAGE_SIZE);
        setAfter(res.data.media.paging.cursors.after || null);
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        console.log(e);
      })
      .finally(() => {
        setIsLoading(false);
      });
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
    console.log(`value before update`, getValues()?.contents?.[index]);

    updateContents(index, {
      ...(mode === ContentCycleContentModeEnum.CONTENT_CYCLE
        ? getValues()?.contents?.[index]
        : getValues()?.reminders?.[index]),
      instagramPost: { mediaUrl, mediaId: postId },
    });
    setIsOpen(false);
  };

  const t = useTranslations("InstagramPostDialog");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {contents[index].instagramPost?.mediaUrl ? (
          <div className="relative w-48 h-48 rounded-lg overflow-hidden">
            <Image
              src={contents[index].instagramPost.mediaUrl}
              alt="cover"
              fill
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 duration-150 flex justify-center items-center">
              <Button type="button" className="text-white">
                {t("changePost")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-y-2">
            <Button type="button" variant="outline">
              {t("selectPost")}
            </Button>
            {errors?.contents?.[index]?.id && (
              <ErrorMessage>{errors.contents[index].id.message}</ErrorMessage>
            )}
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[50rem]">
        <DialogHeader>
          <DialogTitle>{t("selectPost")}</DialogTitle>
          <DialogDescription>{t("seeYourLastPosts")}</DialogDescription>
        </DialogHeader>
        <InfiniteScroll
          dataLength={posts.length}
          next={() => fetchPosts(after)}
          hasMore={hasMore}
          loader={<></>}
          endMessage={<p>{t("thereIsNoMore")}</p>}
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
                    data-mediaurl={
                      post.media_type === "VIDEO"
                        ? post.thumbnail_url
                        : post.media_url
                    }
                    onClick={selectPost}
                  >
                    <Image
                      src={
                        post.media_type === "VIDEO"
                          ? post.thumbnail_url
                          : post.media_url
                      }
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
          <Button onClick={() => setIsOpen(false)}>{t("close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramPostsDialog;
