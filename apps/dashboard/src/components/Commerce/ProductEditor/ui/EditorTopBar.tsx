'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

/**
 * The sticky glass bar from the design: breadcrumb, live title, readiness pill, three actions.
 *
 * Translucent with a backdrop blur so the form scrolling underneath stays visible instead of
 * disappearing behind an opaque slab.
 */

/**
 * The pill is DERIVED, every render, from what the form currently holds. It is deliberately NOT
 * a `status` field: the design has no status picker, and this page never writes one (spec,
 * decision 1). It answers one question — "would publishing this work right now?" — in the order
 * a merchant hits the problems: no title at all, then variations that cannot be saved because
 * `commerce_product_variant.price` is NOT NULL, then ready.
 */
type PillKey = 'statusNoTitle' | 'statusNoPrice' | 'statusReady';

const PILL_TONE: Record<PillKey, string> = {
  statusNoTitle: 'bg-muted text-mut border-ln',
  statusNoPrice: 'bg-wtint text-wtext border-wline',
  statusReady: 'bg-success/15 text-success border-transparent',
};

export const EditorTopBar = ({
  mode,
  title,
  unpricedCount,
  isSaving,
  canSubmit,
  onPreview,
  onRevert,
  onSave,
}: {
  mode: 'create' | 'edit';
  title: string;
  /** Variations whose price is still blank. Anything above zero blocks the save. */
  unpricedCount: number;
  isSaving: boolean;
  canSubmit: boolean;
  onPreview: () => void;
  onRevert: () => void;
  onSave: () => void;
}) => {
  const t = useTranslations('Commerce.Editor.TopBar');

  const pill: PillKey = !title.trim()
    ? 'statusNoTitle'
    : unpricedCount > 0
      ? 'statusNoPrice'
      : 'statusReady';

  const pillLabel =
    pill === 'statusNoPrice'
      ? t('statusNoPrice', { count: e2pNumbers(String(unpricedCount)) })
      : t(pill);

  return (
    <div className="bg-muted/80 border-ln sticky top-0 z-15 -mx-4 border-b px-4 py-3.5 backdrop-blur-md backdrop-saturate-150 md:-mx-8 md:px-8">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <nav aria-label={t('breadcrumb')} className="text-mut flex items-center gap-2 text-xs">
            <Link href="/products" className="hover:text-foreground transition-colors">
              {t('products')}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{mode === 'create' ? t('newProduct') : t('editProduct')}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-secondary max-w-[340px] truncate text-base font-extrabold">
              {title.trim() || t('untitled')}
            </h1>
            <Badge
              variant="outline"
              data-testid="editor-status-pill"
              className={cn('gap-1.5 rounded-full border font-bold', PILL_TONE[pill])}
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {pillLabel}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onPreview}>
            {t('preview')}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={onRevert}>
            {t('revert')}
          </Button>
          <Button
            type="button"
            size="sm"
            data-testid="editor-save"
            disabled={!canSubmit || isSaving}
            onClick={onSave}
          >
            {isSaving ? t('saving') : t('save')}
          </Button>
        </div>
      </div>
    </div>
  );
};
