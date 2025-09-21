"use client";

import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import api from "@/hooks/swr/api-client";
import { AutomationFormType } from "@/schemas/automationForm";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { MouseEvent, useEffect, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import InfiniteScroll from "react-infinite-scroll-component";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from "@befroosh/ui";

type IGPostContentDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  index: number;
  mode: AutomationContentModeEnum;
};

const PAGE_SIZE = 9;

export const IGPostContentDialog = ({
  isOpen,
  setIsOpen,
  index,
  mode,
}: IGPostContentDialogProps) => {
  const [hasMore, setHasMore] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [after, setAfter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("Automations.Contents.InstagramPost.Dialog");

  const { getValues, control } = useFormContext<AutomationFormType>();
  const { update: updateContents } = useFieldArray({
    control: control,
    name:
      mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders",
    keyName: "_xid",
  });

  const fetchPosts = async (afterCursor: string | null = null) => {
    setIsLoading(true);
    try {
      const url = afterCursor
        ? `/posts/pure?after=${afterCursor}`
        : `/posts/pure`;

      const res = await api.get(url);
      setPosts((prevPosts) => [...prevPosts, ...res.data.media.data]);
      setHasMore(res.data.media.data.length === PAGE_SIZE);
      setAfter(res.data.media.paging.cursors.after || null);
    } catch (e: any) {
      console.error("Error fetching posts:", e);
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

    const currentValues =
      mode === AutomationContentModeEnum.AUTOMATION
        ? getValues()?.contents?.[index]
        : getValues()?.reminders?.[index];

    updateContents(index, {
      ...currentValues,
      instagramPost: { mediaUrl, mediaId: postId },
    });

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[50rem]">
        <DialogHeader>
          <DialogTitle>{t("select_post")}</DialogTitle>
          <DialogDescription>{t("see_your_last_posts")}</DialogDescription>
        </DialogHeader>
        <InfiniteScroll
          dataLength={posts.length}
          next={() => fetchPosts(after)}
          hasMore={hasMore}
          loader={<></>}
          endMessage={<p>{t("there_is_no_more")}</p>}
          scrollableTarget="scrollableDiv"
        >
          <div
            className="grid w-full grid-cols-3 gap-4"
            id="scrollableDiv"
            style={{ maxHeight: "60vh", overflowY: "auto" }}
          >
            {!posts.length && isLoading
              ? Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="col-span-1">
                    <Skeleton className="relative h-56 w-full" />
                  </div>
                ))
              : posts.map((post) => (
                  <div
                    className="relative col-span-1 h-56 w-full cursor-pointer overflow-hidden rounded-sm bg-black"
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
                      fill
                      className="object-cover duration-150 hover:opacity-80"
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
