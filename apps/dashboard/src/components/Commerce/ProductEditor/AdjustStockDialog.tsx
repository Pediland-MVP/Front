'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { mutate } from 'swr';

import api from '@/hooks/swr/api-client';
import { useSelectOnFocus } from '@/hooks/useSelectOnFocus';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/formatNumber';
import { onInputP2EHandler } from '@/utils/p2eNumber';
import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from '@/components/ui';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variantId: string;
  variantLabel: string;
  currentOnHand: number;
  currentLowStockThreshold: number | null;
}

type Direction = 'increase' | 'decrease';

/**
 * `PATCH /commerce/products/:id/stock` takes `onHand` as the ABSOLUTE target — never a
 * delta — and always records `reason: manual` server-side for a user-initiated edit (the
 * `ADJUSTMENT` enum value exists but is unused for this flow). The "افزایش/کاهش" toggle here
 * is a pure client-side helper: it only changes how a typed "مقدار تغییر" amount is folded
 * into the single "موجودی جدید" (new stock) field the user can also edit directly — it never
 * becomes a distinct field in the request body.
 */
export const AdjustStockDialog = ({
  open,
  onOpenChange,
  productId,
  variantId,
  variantLabel,
  currentOnHand,
  currentLowStockThreshold,
}: AdjustStockDialogProps) => {
  const t = useTranslations('Commerce.Editor.Inventory.Adjust');
  const { onFocus } = useSelectOnFocus();
  const { can } = usePermissions();
  const canEdit = can('product:edit');

  const [newOnHand, setNewOnHand] = useState(currentOnHand);
  const [direction, setDirection] = useState<Direction>('increase');
  const [deltaAmount, setDeltaAmount] = useState<number | undefined>(undefined);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Re-seed every time the dialog opens for a (possibly different) variant — mirrors
  // `VariantMediaPickerDialog`'s re-seed-on-open convention, so a previous variant's
  // in-progress edit never leaks into the next one.
  useEffect(() => {
    if (!open) return;
    setNewOnHand(currentOnHand);
    setDirection('increase');
    setDeltaAmount(undefined);
    setLowStockThreshold(currentLowStockThreshold ?? undefined);
  }, [open, variantId, currentOnHand, currentLowStockThreshold]);

  // Purely local helper: folds the typed delta amount (always entered as a positive
  // magnitude) into the single "new stock" field the request actually submits, using
  // `direction`'s sign. Never sent to the backend as a separate value.
  const applyDelta = (amount: number | undefined, dir: Direction) => {
    setDeltaAmount(amount);
    if (amount === undefined) return;
    const signed = dir === 'increase' ? amount : -amount;
    setNewOnHand(Math.max(0, currentOnHand + signed));
  };

  const isInvalid = !Number.isFinite(newOnHand) || newOnHand < 0;

  const handleSubmit = async () => {
    // Defense-in-depth: the backend already enforces `product:edit` on
    // `PATCH /commerce/products/:id/stock`, but the request must never even fire when the
    // viewer lacks the permission — the submit button below is also disabled for the same case.
    if (isInvalid || !canEdit) return;

    setIsSaving(true);
    try {
      await api.patch(`/commerce/products/${productId}/stock`, [
        {
          variantId,
          onHand: newOnHand,
          ...(lowStockThreshold !== undefined && { lowStockThreshold }),
        },
      ]);
      toast.success(t('success'));
      onOpenChange(false);
    } catch {
      // Only a PATCH failure is a real save error — a hiccup in the revalidating `mutate`
      // below must not report this as failed (same convention as
      // `VariantMediaPickerDialog#handleSave`/`MediaSection#handleDragEnd`).
      toast.error(t('error'));
    } finally {
      // Revalidate every cached key under this product — both the product detail (so the
      // variant's `onHand` shown elsewhere refreshes) and any open ledger query for this
      // variant (so the newly-recorded movement appears). A rejection here is caught, not
      // just contained by the nested `finally`, so it can't strand `isSaving` in a loading
      // state nor get misreported as a save failure — the already-shown success/error toast
      // above is unaffected either way.
      try {
        await mutate(mutateIncludeStringKey(`/commerce/products/${productId}`));
      } catch {
        // intentionally silent — see comment above
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{variantLabel}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('currentStock')}</span>
            <span className="font-medium tabular-nums">{formatNumber(currentOnHand)}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('deltaAmount')}</Label>
            <div className="flex items-center gap-2">
              <div className="flex overflow-hidden rounded-md border">
                <button
                  type="button"
                  onClick={() => {
                    setDirection('increase');
                    applyDelta(deltaAmount, 'increase');
                  }}
                  className={cn(
                    'px-3 py-1.5 text-sm',
                    direction === 'increase' ? 'bg-primary text-primary-foreground' : 'bg-card',
                  )}
                >
                  {t('directionIncrease')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirection('decrease');
                    applyDelta(deltaAmount, 'decrease');
                  }}
                  className={cn(
                    'px-3 py-1.5 text-sm',
                    direction === 'decrease' ? 'bg-primary text-primary-foreground' : 'bg-card',
                  )}
                >
                  {t('directionDecrease')}
                </button>
              </div>
              <input
                inputMode="numeric"
                onInput={onInputP2EHandler}
                placeholder="۰"
                value={deltaAmount === undefined ? '' : (formatNumber(deltaAmount) ?? '')}
                onFocus={onFocus}
                onChange={(e) =>
                  applyDelta(e.target.value === '' ? undefined : +e.target.value, direction)
                }
                className="border-input h-9 flex-1 rounded-md border bg-transparent px-3 text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-stock-new-on-hand">{t('newStock')}</Label>
            <input
              id="adjust-stock-new-on-hand"
              data-testid="adjust-stock-new-on-hand"
              inputMode="numeric"
              onInput={onInputP2EHandler}
              placeholder="۰"
              value={formatNumber(newOnHand) ?? ''}
              onFocus={onFocus}
              onChange={(e) => setNewOnHand(e.target.value === '' ? 0 : +e.target.value)}
              className="border-input h-9 rounded-md border bg-transparent px-3 text-sm tabular-nums"
            />
            {isInvalid && <p className="text-destructive text-xs">{t('invalidStock')}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-stock-low-threshold">{t('lowStockThreshold')}</Label>
            <input
              id="adjust-stock-low-threshold"
              inputMode="numeric"
              onInput={onInputP2EHandler}
              placeholder="۰"
              value={lowStockThreshold === undefined ? '' : (formatNumber(lowStockThreshold) ?? '')}
              onFocus={onFocus}
              onChange={(e) =>
                setLowStockThreshold(e.target.value === '' ? undefined : +e.target.value)
              }
              className="border-input h-9 rounded-md border bg-transparent px-3 text-sm tabular-nums"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <ButtonLoading
            type="button"
            isLoading={isSaving}
            disabled={isInvalid || !canEdit}
            onClick={handleSubmit}
          >
            {t('submit')}
          </ButtonLoading>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
