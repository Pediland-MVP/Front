// app/(Console)/automations/components/dialog.instagramPostSelect.tsxs
"use client";

import { ErrorMessage } from "@/components/index";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import api from "@/hooks/swr/api-client";
import { cn } from "@/lib/utils";
import { AutomationFormType } from "@/schemas/automationForm";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { InstagramLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { MouseEvent, useEffect, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import InfiniteScroll from "react-infinite-scroll-component";

const PAGE_SIZE = 9;

export type DialogInstagramPostSelectProps = {
  index: number;
  mode: AutomationContentModeEnum;
  className?: string;
  btnVariant?: "outline" | "secondary";
};

export default function DialogInstagramPostSelect({
  index,
  mode,
  ...props
}: DialogInstagramPostSelectProps) {
  const {
    getValues,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<AutomationFormType>();

  const { fields: contents, update: updateContents } = useFieldArray({
    control: control,
    name:
      mode === AutomationContentModeEnum.REMINDER ? "reminders" : "contents",
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
          : `${process.env.NEXT_PUBLIC_BACK_API_URL}/posts/pure`,
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
    const mediaUrl = e.currentTarget.dataset.mediaurl;
    const mediaId = e.currentTarget.dataset.postid!;
    setValue("instagramPost", { picture: { url: mediaUrl }, mediaId });
    setIsOpen(false);
  };

  const t = useTranslations("InstagramPostDialog");

  return (
    <div className={cn(props.className)}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {watch("instagramPost")?.picture?.url ? (
            <div className="flex w-full items-center justify-center">
              <div className="relative h-auto w-32 overflow-hidden rounded-lg">
                <Image
                  src={watch("instagramPost")?.picture?.url || ""}
                  alt="cover"
                  width={128}
                  height={228}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 duration-150 hover:opacity-100">
                  <Button type="button" variant={"outline"} size={"sm"}>
                    {t("changePost")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[228px] w-full flex-col items-center justify-center rounded-2xl bg-black/10">
              <Button type="button" variant={props.btnVariant} size={"sm"}>
                <InstagramLogoIcon className="size-5" />
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
                      className="relative col-span-1 h-56 w-full overflow-hidden rounded-sm bg-black"
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
}
