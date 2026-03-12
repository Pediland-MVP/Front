"use client";

import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import api from "@/hooks/swr/api-client";
import { cn } from "@/lib/utils";
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
  DialogTrigger,
  Skeleton,
} from "@/components/ui";
import { ErrorMessage } from "@/components/ui-custom/ErrorMessage";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

const PAGE_SIZE = 9;

type InstagramPostSelectDialogProps = {
  index: number;
  mode: AutomationContentModeEnum;
  className?: string;
  btnVariant?: "outline" | "secondary";
};

export const InstagramPostSelectDialog = ({
  index,
  mode,
  ...props
}: InstagramPostSelectDialogProps) => {
  const {
    getValues,
    control,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useFormContext<AutomationFormType>();
  const t = useTranslations("Automations.InstagramPostSelectDialog");
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
          ? `${API_URL}/posts/pure?after=${afterCursor}`
          : `${API_URL}/posts/pure`,
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

  const selectPost = async (e: MouseEvent<HTMLDivElement>) => {
    const mediaUrl = e.currentTarget.dataset['mediaurl'];
    const mediaId = e.currentTarget.dataset['postid']!;
    setValue("instagramPost", { picture: { url: mediaUrl }, mediaId });
    await trigger("instagramPost");
    setIsOpen(false);
  };

  return (
    <div className={cn("mt-2", props.className)}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex cursor-pointer items-center justify-center rounded-lg bg-gray-200 duration-300 hover:bg-gray-300/90">
              {watch("instagramPost")?.picture?.url ? (
                <div className="relative aspect-square size-42">
                  <Image
                    src={watch("instagramPost")?.picture?.url || ""}
                    alt="cover"
                    fill
                    className="rounded-lg object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-linear-to-t from-black to-transparent opacity-0 duration-150 hover:opacity-100">
                    <span className="text-xs text-white hover:no-underline">
                      {t("change_post")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex size-42 cursor-pointer items-center justify-center rounded-lg bg-gray-200 duration-300 hover:bg-gray-300/90">
                  <span className="text-sm">{t("select_post")}</span>
                  {errors?.contents?.[index]?.id && (
                    <ErrorMessage>
                      {errors.contents[index].id.message}
                    </ErrorMessage>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[50rem]">
          <DialogHeader>
            <DialogTitle>{t("select_instagram_post")}</DialogTitle>
            <DialogDescription>{t("see_your_last_posts")}</DialogDescription>
          </DialogHeader>
          <InfiniteScroll
            dataLength={posts.length}
            next={() => fetchPosts(after)}
            hasMore={hasMore}
            loader={<></>}
            endMessage={
              <p className="text-muted-foreground mt-4 text-center text-sm">
                {t("there_is_no_more")}
              </p>
            }
            scrollableTarget="scrollableDiv"
          >
            <div
              className="grid w-full grid-cols-3 gap-4"
              id="scrollableDiv"
              style={{ maxHeight: "60vh", overflowY: "auto" }}
            >
              {!posts.length
                ? Array.from({ length: 9 }).map((_, index) => (
                    <div key={index} className="col-span-1">
                      <Skeleton className="relative h-56 w-full" />
                    </div>
                  ))
                : Array.isArray(posts) &&
                  posts.map((post) => (
                    <div
                      className="relative col-span-1 h-56 w-full overflow-hidden rounded-md bg-black"
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
                        className="duration-150 hover:opacity-80"
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
    </div>
  );
};
