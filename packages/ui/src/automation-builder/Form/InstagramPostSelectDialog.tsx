'use client';

import { AutomationContentModeEnum } from '../constants/automationContent.enum';
import { cn } from '@/lib/utils';
import { AutomationFormType } from '../schemas/automationForm';
import { AutomationBuilderApiClient } from '../types/apiClient';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { MouseEvent, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import InfiniteScroll from 'react-infinite-scroll-component';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';

const PAGE_SIZE = 9;

export type SelectedInstagramPost = {
  mediaId: string;
  mediaUrl?: string;
  permalink?: string;
};

type InstagramPostSelectDialogProps = {
  index: number;
  mode: AutomationContentModeEnum;
  className?: string;
  btnVariant?: 'outline' | 'secondary';
  apiClient: AutomationBuilderApiClient;
  /**
   * Controls the dialog's open state from outside instead of the built-in thumbnail
   * trigger's own state. Used by the "Instagram Post" button-type picker, which needs to
   * run a single-Instagram-account guard check before the dialog is allowed to open. When
   * omitted, the dialog manages its own open state via its default trigger (پست خاص usage
   * — unchanged).
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * When provided, selecting a post calls this instead of writing to the form's
   * `instagramPost` field, and the default thumbnail trigger is not rendered (the caller
   * supplies its own trigger UI). Used by the "Instagram Post" button-type picker.
   */
  onSelect?: (post: SelectedInstagramPost) => void;
};

export const InstagramPostSelectDialog = ({
  index,
  mode,
  apiClient,
  open: controlledOpen,
  onOpenChange,
  onSelect,
  ...props
}: InstagramPostSelectDialogProps) => {
  const {
    getValues,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useFormContext<AutomationFormType>();
  const t = useTranslations('Automations.InstagramPostSelectDialog');
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };
  const [hasMore, setHasMore] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [after, setAfter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPosts = async (afterCursor: string | null = null) => {
    setIsLoading(true);
    // A specific post always belongs to exactly one Instagram account. This dialog
    // is only reachable when the form has locked the selection down to one
    // (TargetPostComment.tsx / Conditions.tsx / InstagramSelectField.tsx, or the
    // button-type picker's own guard in ContentButtonsItem.tsx, enforce that), but
    // don't just grab instagramIds[0] and trust the invariant silently — if it's ever
    // violated, fall back to the account-agnostic endpoint rather than fetching an
    // arbitrary, possibly-wrong account's posts.
    const selectedInstagramIds = getValues('instagramIds') ?? [];
    const instagramId = selectedInstagramIds.length === 1 ? selectedInstagramIds[0] : undefined;
    const params = new URLSearchParams();
    if (afterCursor) {
      params.set('after', afterCursor);
    }
    if (instagramId) {
      params.set('instagramId', instagramId);
    }
    const queryString = params.toString();
    // Fetched through the injected `apiClient` instead of the dashboard-only, auth-
    // interceptor-bearing axios client — same pattern as `IGPostContentDialog.tsx`.
    await apiClient
      .get(`/posts/pure${queryString ? `?${queryString}` : ''}`)
      .then((res) => {
        setPosts((prevPosts) => [...prevPosts, ...res.data.media.data]);
        setHasMore(res.data.media.data.length === PAGE_SIZE);
        setAfter(res.data.media.paging.cursors.after || null);
      })
      .catch((e: unknown) => {
        console.error(e);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const selectPost = async (e: MouseEvent<HTMLDivElement>) => {
    const mediaUrl = e.currentTarget.dataset['mediaurl'];
    const mediaId = e.currentTarget.dataset['postid']!;
    const permalink = e.currentTarget.dataset['permalink'];
    if (onSelect) {
      onSelect({ mediaId, mediaUrl, permalink });
    } else {
      setValue('instagramPost', { picture: { url: mediaUrl }, mediaId });
      await trigger('instagramPost');
    }
    setIsOpen(false);
  };

  return (
    <div className={cn('mt-2', props.className)}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {!onSelect ? (
          <DialogTrigger asChild>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex cursor-pointer items-center justify-center rounded-lg bg-gray-200 duration-300 hover:bg-gray-300/90">
                {watch('instagramPost')?.picture?.url ? (
                  <div className="relative aspect-square size-42">
                    <Image
                      src={watch('instagramPost')?.picture?.url || ''}
                      alt="cover"
                      fill
                      className="rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-linear-to-t from-black to-transparent opacity-0 duration-150 hover:opacity-100">
                      <span className="text-xs text-white hover:no-underline">
                        {t('change_post')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex size-42 cursor-pointer items-center justify-center rounded-lg bg-gray-200 duration-300 hover:bg-gray-300/90">
                    <span className="text-sm">{t('select_post')}</span>
                    {errors?.contents?.[index]?.id && (
                      <ErrorMessage>{errors.contents[index].id.message}</ErrorMessage>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogTrigger>
        ) : null}

        <DialogContent className="sm:max-w-[50rem]">
          <DialogHeader>
            <DialogTitle>{t('select_instagram_post')}</DialogTitle>
            <DialogDescription>{t('see_your_last_posts')}</DialogDescription>
          </DialogHeader>
          <InfiniteScroll
            dataLength={posts.length}
            next={() => fetchPosts(after)}
            hasMore={hasMore}
            loader={<></>}
            endMessage={
              <p className="text-muted-foreground mt-4 text-center text-sm">
                {t('there_is_no_more')}
              </p>
            }
            scrollableTarget="scrollableDiv"
          >
            <div
              className="grid w-full grid-cols-3 gap-4"
              id="scrollableDiv"
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
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
                        post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url
                      }
                      data-permalink={post.permalink}
                      onClick={selectPost}
                    >
                      <Image
                        src={post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url}
                        alt={post.caption || 'Instagram Post'}
                        layout="fill"
                        objectFit="cover"
                        className="duration-150 hover:opacity-80"
                      />
                    </div>
                  ))}
            </div>
          </InfiniteScroll>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>{t('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
