'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import { HistoryIcon, Settings2Icon } from 'lucide-react';
import useSWRImmutable from 'swr/immutable';

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

  const rows = watchedVariants.map((variant, index) => ({
    index,
    variantId: variant.id,
    label: getVariantLabel(variant.valueIndexes ?? []),
    onHand: existingVariants.find((existing) => existing.id === variant.id)?.onHand,
  }));

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [adjustVariantId, setAdjustVariantId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LEDGER_DEFAULT_LIMIT);

  // A fresh variant selection always starts back at page 1 of its own ledger.
  useEffect(() => {
    setPage(1);
  }, [selectedVariantId]);

  const selectedRow = rows.find((row) => row.variantId === selectedVariantId);
  const adjustRow = rows.find((row) => row.variantId === adjustVariantId);

  const shouldFetchLedger = mode === 'edit' && !!productId && !!selectedVariantId;
  const {
    data: ledgerData,
    error: ledgerError,
    isLoading: isLedgerLoading,
  } = useSWRImmutable<PaginatedResult<CommerceStockMovement[]>>(
    shouldFetchLedger
      ? `/commerce/products/${productId}/movements/${selectedVariantId}?page=${page}&limit=${limit}`
      : null,
  );

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
  const movementsWithBalance = reconstructLedgerBalances(movements, currentOnHand);
  const meta = ledgerData?.meta;

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
                                disabled={isUnsaved}
                                data-testid={`inventory-adjust-stock-${row.index}`}
                                onClick={() => setAdjustVariantId(row.variantId ?? null)}
                              >
                                <Settings2Icon size={14} />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isUnsaved ? t('unsavedTooltip') : t('adjustStock')}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Ledger.Columns.date')}</TableHead>
                      <TableHead>{t('Ledger.Columns.reason')}</TableHead>
                      <TableHead className="text-end">{t('Ledger.Columns.delta')}</TableHead>
                      <TableHead className="text-end">{t('Ledger.Columns.balanceAfter')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movementsWithBalance.map((movement) => (
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
                    {movementsWithBalance.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          {t('Ledger.empty')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <ItemsPagination
                  isLoading={isLedgerLoading}
                  onPageChange={setPage}
                  onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                  }}
                  totalCount={meta?.totalItems ?? 0}
                  serverPage={meta?.currentPage ?? page}
                  serverPerPage={meta?.itemsPerPage ?? limit}
                  serverItemCount={meta?.itemCount ?? movements.length}
                  serverTotalPages={meta?.totalPages ?? 1}
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
        />
      )}
    </div>
  );
};
