'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import { HistoryIcon, Settings2Icon } from 'lucide-react';
import useSWRImmutable from 'swr/immutable';

import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/formatNumber';
import type {
  CommerceStockMovement,
  CommerceStockMovementReason,
  CommerceVariantDetail,
  PaginatedResult,
} from '@/types/commerce';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { ItemsPagination } from '@/components/Console/ItemsPagination';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';

import { AdjustStockDialog } from '../AdjustStockDialog';
import type { ProductFormValues } from '../productForm.schema';
import { reconstructLedgerBalances } from '../reconstructLedgerBalances.util';

interface InventorySectionProps {
  mode: 'create' | 'edit';
  productId?: string;
  /** The fetched product's variants (edit mode only) — the ONLY source of a variant's live
   * `onHand`. Every row here is keyed against the FORM's live `variants` array (below) rather
   * than this list directly, because a variant added this session (via `VariantsSection`'s
   * "regenerate") has no matching entry here yet — see the per-row gating comment below. */
  existingVariants?: CommerceVariantDetail[];
}

const LEDGER_DEFAULT_LIMIT = 20;
// The backend's `ReadMovementsDto.limit` hard-caps at 200 (`@Max(200)`). We fetch a single
// page at this cap — ordered DESC by `createDate` (the service's own default order, see
// `InventoryService#movementsOf`) — and reconstruct `balanceAfter` ONCE over that whole set,
// then paginate the already-reconstructed array CLIENT-SIDE for display. Re-fetching a new
// server page per click would feed `reconstructLedgerBalances` a stale anchor for page 2+
// (see the util's contract: `movements[0]` must be the single most recent change overall) —
// see the fix-report for the full incident writeup.
const LEDGER_FETCH_LIMIT = 200;

/**
 * Ledger + adjust-stock UI. Both `GET .../movements/:variantId` and
 * `PATCH .../stock` require a real, persisted variant id — a variant added this session (via
 * `VariantsSection`'s "regenerate", not yet saved) has none, so its row's actions stay
 * disabled with an explanatory tooltip, mirroring `VariantsSection`'s per-variant media-button
 * gate and `MediaSection`'s whole-section "save the product first" gate.
 */
export const InventorySection = ({
  mode,
  productId,
  existingVariants = [],
}: InventorySectionProps) => {
  const t = useTranslations('Commerce.Editor.Inventory');
  const form = useFormContext<ProductFormValues>();
  const { can } = usePermissions();
  // `viewLedger` only reads (`GET .../movements/:variantId`, gated `product:view` server-side)
  // — no permission check needed for that button. `adjustStock` opens a dialog whose
  // `handleSubmit` PATCHes stock, which the backend gates on `product:edit`.
  const canEditStock = can('product:edit');

  // Same `useWatch` source `VariantsSection` reads from, so variant labels here always match
  // what the merchant sees in the Variants & pricing table — including a variant added this
  // session that has no backend id (and therefore no entry in `existingVariants`) yet.
  const watchedOptions = useWatch({ control: form.control, name: 'options' }) ?? [];
  const watchedVariants = useWatch({ control: form.control, name: 'variants' }) ?? [];

  const getVariantLabel = (valueIndexes: number[]) => {
    if (watchedOptions.length === 0) return t('defaultVariantLabel');
    return valueIndexes
      .map((valueIndex, optionIndex) => watchedOptions[optionIndex]?.values[valueIndex]?.value)
      .filter(Boolean)
      .join(' / ');
  };

  const rows = watchedVariants.map((variant, index) => {
    const existing = existingVariants.find((existing) => existing.id === variant.id);
    return {
      index,
      variantId: variant.id,
      label: getVariantLabel(variant.valueIndexes ?? []),
      onHand: existing?.onHand,
      lowStockThreshold: existing?.lowStockThreshold ?? null,
    };
  });

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [adjustVariantId, setAdjustVariantId] = useState<string | null>(null);
  // These two are LOCAL display pagination only — they slice the already-reconstructed
  // array in memory, they never trigger a new server fetch (see `LEDGER_FETCH_LIMIT` above).
  const [displayPage, setDisplayPage] = useState(1);
  const [displayLimit, setDisplayLimit] = useState(LEDGER_DEFAULT_LIMIT);

  const selectedRow = rows.find((row) => row.variantId === selectedVariantId);
  const adjustRow = rows.find((row) => row.variantId === adjustVariantId);

  const shouldFetchLedger = mode === 'edit' && !!productId && !!selectedVariantId;
  const {
    data: ledgerData,
    error: ledgerError,
    isLoading: isLedgerLoading,
  } = useSWRImmutable<PaginatedResult<CommerceStockMovement[]>>(
    shouldFetchLedger
      ? `/commerce/products/${productId}/movements/${selectedVariantId}?page=1&limit=${LEDGER_FETCH_LIMIT}`
      : null,
  );

  // Reset the display page to 1 both when a fresh variant is selected AND whenever the
  // underlying ledger data itself is re-fetched — `useSWRImmutable` never revalidates on its
  // own, so the only way `ledgerData` changes for the SAME variant is `AdjustStockDialog`'s
  // post-save `mutate()` call. That covers the "reset after a successful stock adjustment"
  // case for free, without a separate callback wired through the dialog.
  useEffect(() => {
    setDisplayPage(1);
  }, [selectedVariantId, ledgerData]);

  // Direct `mode`/`productId` checks (not a derived boolean) so TS narrows `productId` from
  // `string | undefined` to `string` for the rest of the component — same convention
  // `MediaSection` uses for its own whole-section gate.
  if (mode !== 'edit' || !productId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t('saveProductFirst')}</p>
        </CardContent>
      </Card>
    );
  }

  const reasonLabel = (movement: CommerceStockMovement): string => {
    const reason: CommerceStockMovementReason = movement.reason;
    if (reason === 'order') return t('Reasons.order', { referenceId: movement.referenceId ?? '' });
    if (reason === 'import') return t('Reasons.import');
    if (reason === 'migration') return t('Reasons.migration');
    if (reason === 'refund') return t('Reasons.refund');
    // `manual` and the unused `adjustment` enum value both render the same way — the backend
    // always records `reason: manual` for a user-initiated edit (see `AdjustStockDialog`'s
    // comment), so this branch also silently covers `adjustment` if it's ever encountered.
    return t('Reasons.manual');
  };

  const movements = ledgerData?.items ?? [];
  const currentOnHand = selectedRow?.onHand ?? 0;
  // Reconstructed ONCE over the whole fetched (up-to-`LEDGER_FETCH_LIMIT`) set — `movements[0]`
  // really is the single most recent change overall, so `currentOnHand` is a valid anchor for
  // every row, not just the first server page's worth.
  const movementsWithBalance = reconstructLedgerBalances(movements, currentOnHand);
  const meta = ledgerData?.meta;

  // The backend may have more movements than our fetch cap can hold — never silently show a
  // partial view with no explanation (see `LEDGER_FETCH_LIMIT`'s comment).
  const isLedgerTruncated = !!meta && meta.totalItems > movements.length;

  // Client-side slice of the already-reconstructed array for the page the merchant is viewing.
  const displayTotalPages = Math.max(1, Math.ceil(movementsWithBalance.length / displayLimit));
  const displayStartIndex = (displayPage - 1) * displayLimit;
  const pagedMovements = movementsWithBalance.slice(
    displayStartIndex,
    displayStartIndex + displayLimit,
  );

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Columns.variant')}</TableHead>
                <TableHead>{t('Columns.stock')}</TableHead>
                <TableHead className="w-40"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isUnsaved = !row.variantId;
                const isAdjustDisabled = isUnsaved || !canEditStock;
                return (
                  <TableRow
                    key={row.index}
                    data-state={row.variantId === selectedVariantId ? 'selected' : undefined}
                  >
                    <TableCell className="text-start font-medium">{row.label}</TableCell>
                    <TableCell className="tabular-nums">
                      {row.onHand !== undefined ? formatNumber(row.onHand) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={isUnsaved}
                                data-testid={`inventory-view-ledger-${row.index}`}
                                onClick={() => setSelectedVariantId(row.variantId ?? null)}
                              >
                                <HistoryIcon size={14} />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isUnsaved ? t('unsavedTooltip') : t('viewLedger')}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={isAdjustDisabled}
                                data-testid={`inventory-adjust-stock-${row.index}`}
                                onClick={() => setAdjustVariantId(row.variantId ?? null)}
                              >
                                <Settings2Icon size={14} />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isUnsaved
                              ? t('unsavedTooltip')
                              : !canEditStock
                                ? t('noPermissionTooltip')
                                : t('adjustStock')}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    {t('noVariants')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedVariantId && (
        <Card>
          <CardHeader>
            <CardTitle>{t('Ledger.title', { variant: selectedRow?.label ?? '' })}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLedgerLoading ? (
              <LoaderSpin />
            ) : ledgerError ? (
              <p className="text-destructive text-sm">{t('Ledger.loadError')}</p>
            ) : (
              <>
                {isLedgerTruncated && (
                  <p
                    className="text-muted-foreground mb-3 text-sm"
                    data-testid="inventory-ledger-truncated-notice"
                  >
                    {t('Ledger.truncatedNotice', { limit: LEDGER_FETCH_LIMIT })}
                  </p>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Ledger.Columns.date')}</TableHead>
                      <TableHead>{t('Ledger.Columns.reason')}</TableHead>
                      <TableHead className="text-end">{t('Ledger.Columns.delta')}</TableHead>
                      <TableHead className="text-end">{t('Ledger.Columns.balanceAfter')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody data-testid="inventory-ledger-rows">
                    {pagedMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="tabular-nums">
                          {new Date(movement.createDate).toLocaleString('fa-IR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{reasonLabel(movement)}</Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-end tabular-nums',
                            movement.delta > 0 && 'text-green-600',
                            movement.delta < 0 && 'text-destructive',
                          )}
                        >
                          {movement.delta > 0 ? '+' : ''}
                          {formatNumber(movement.delta)}
                        </TableCell>
                        <TableCell className="text-end font-medium tabular-nums">
                          {formatNumber(movement.balanceAfter)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {pagedMovements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          {t('Ledger.empty')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Local, in-memory pagination over the already-reconstructed array — no
                    server fetch is triggered by page/limit changes here (see
                    `LEDGER_FETCH_LIMIT`'s comment). */}
                <ItemsPagination
                  isLoading={isLedgerLoading}
                  onPageChange={setDisplayPage}
                  onLimitChange={(newLimit) => {
                    setDisplayLimit(newLimit);
                    setDisplayPage(1);
                  }}
                  totalCount={movementsWithBalance.length}
                  serverPage={displayPage}
                  serverPerPage={displayLimit}
                  serverItemCount={pagedMovements.length}
                  serverTotalPages={displayTotalPages}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {adjustRow?.variantId && (
        <AdjustStockDialog
          open={!!adjustVariantId}
          onOpenChange={(open) => {
            if (!open) setAdjustVariantId(null);
          }}
          productId={productId}
          variantId={adjustRow.variantId}
          variantLabel={adjustRow.label}
          currentOnHand={adjustRow.onHand ?? 0}
          currentLowStockThreshold={adjustRow.lowStockThreshold}
        />
      )}
    </div>
  );
};
