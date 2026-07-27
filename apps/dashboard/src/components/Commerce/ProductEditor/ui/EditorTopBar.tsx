'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import type { CommerceProductStatus } from '@/types/commerce';

import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';

/**
 * Dot colour per product status. Status is the one thing a merchant needs to see without
 * scrolling — a product can be fully filled in and still invisible to buyers because it is a
 * draft, and that is the single most common "why is my product not on the site" question.
 */
const STATUS_TONE: Record<CommerceProductStatus, string> = {
  draft: 'bg-warning/15 text-wtext',
  active: 'bg-success/15 text-success',
  archived: 'bg-muted text-mut',
};

/**
 * The sticky header from the design: breadcrumb, live product title, status pill, actions.
 *
 * Translucent with a backdrop blur, so the form scrolling underneath stays visible instead of
 * disappearing behind an opaque slab.
 */
export const EditorTopBar = ({
  mode,
  title,
  status,
  isSubmitting,
  canSubmit,
  isDirty,
  cancelHref,
  onRevert,
}: {
  mode: 'create' | 'edit';
  title: string;
  status: CommerceProductStatus;
  isSubmitting: boolean;
  canSubmit: boolean;
  isDirty: boolean;
  cancelHref: string;
  onRevert: () => void;
}) => {
  const t = useTranslations('Commerce.Editor');

  return (
    <div className="bg-muted/80 border-ln sticky top-0 z-15 -mx-4 border-b px-4 py-3 backdrop-blur-md md:-mx-5 md:px-5">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <nav
            aria-label={t('TopBar.breadcrumb')}
            className="text-mut flex items-center gap-2 text-xs"
          >
            <Link href="/products" className="hover:text-foreground transition-colors">
              {t('TopBar.products')}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{mode === 'create' ? t('TopBar.newProduct') : t('TopBar.editProduct')}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-secondary max-w-[340px] truncate text-base font-extrabold">
              {title.trim() || t('TopBar.untitled')}
            </h1>
            <span
              data-testid="editor-status-badge"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold',
                STATUS_TONE[status],
              )}
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {t(`Basic.StatusOptions.${status}`)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            // Only offered when there is something to undo — a disabled-looking "revert" on a
            // pristine form is noise.
            disabled={!isDirty || isSubmitting}
            data-testid="editor-revert"
            onClick={onRevert}
            className="border-ln bg-card hover:bg-tint h-9 rounded-lg border px-3.5 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50"
          >
            {t('TopBar.revert')}
          </button>
          <Link
            href={cancelHref}
            className="border-ln bg-card hover:bg-tint flex h-9 items-center rounded-lg border px-3.5 text-sm font-semibold transition-colors"
          >
            {t('SaveBar.cancel')}
          </Link>
          <ButtonLoading
            type="submit"
            isLoading={isSubmitting}
            disabled={!canSubmit}
            data-testid="editor-save"
          >
            {t('SaveBar.save')}
          </ButtonLoading>
        </div>
      </div>
    </div>
  );
};
