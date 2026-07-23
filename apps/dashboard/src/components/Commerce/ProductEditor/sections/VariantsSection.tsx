'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext, useWatch, type FieldError } from 'react-hook-form';
import { toast } from 'sonner';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVerticalIcon, ImageIcon } from '@phosphor-icons/react/dist/ssr';
import { PlusIcon, RefreshCcwIcon, Trash2Icon } from 'lucide-react';

import { onInputP2EHandler } from '@/utils/p2eNumber';
import { formatNumber } from '@/utils/formatNumber';
import { useSelectOnFocus } from '@/hooks/useSelectOnFocus';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import type {
  CommerceProductMedia,
  CommerceVariantDetail,
  CommerceVariantMediaAssignment,
} from '@/types/commerce';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DatePicker,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
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

import { VariantMediaPickerDialog } from '../VariantMediaPickerDialog';
import { generateVariantCombinations, OPTION_LIMIT, VARIANT_LIMIT } from '../variantMatrix.util';
import type { ProductFormValues } from '../productForm.schema';

interface VariantsSectionProps {
  mode: 'create' | 'edit';
  /** Needed to build the `PUT .../variants/:variantId/media` URL — the per-variant media
   * picker is disabled entirely without it (mirrors `MediaSection`'s `mode`/`productId` gate). */
  productId?: string;
  /** The product's whole media pool (same `GET /commerce/products/:id` response's `media`
   * field `MediaSection` reads) — the per-variant picker can only choose from it. */
  media?: CommerceProductMedia[];
  /** The fetched product's variants (edit mode only) — used to read the read-only `onHand`
   * figure for the stock column, and (Task 6) each variant's currently-known media
   * assignment for the media button's thumbnail. Never written back to for pricing/stock;
   * those edits go through Task 7's dedicated inventory endpoint. */
  existingVariants?: CommerceVariantDetail[];
}

type OptionValue = ProductFormValues['options'][number]['values'][number];
type Option = ProductFormValues['options'][number];
type Variant = ProductFormValues['variants'][number];

// A value's STABLE identity for diffing purposes: its real backend `id` once persisted, or
// the `_localId` assigned the moment it was typed in this session (see `addValue`). Never the
// value's array position — positions shift on reorder/removal, which is exactly what broke
// the old positional diff (see `handleRegenerate`'s comment).
const getValueIdentity = (value: OptionValue | undefined): string | undefined =>
  value?.id ?? value?._localId;

// A variant combination's diff key is the SORTED set of its selected values' stable
// identities — sorted (not option-position order) so the key survives an option-ROW reorder
// too: reordering options changes which slot in `valueIndexes` a given option occupies, but
// the underlying SET of selected values (and therefore this key) is unchanged.
const getComboKey = (identities: string[]): string => [...identities].sort().join('|');

const getComboIdentities = (combo: number[], options: Option[]): string[] =>
  combo.map(
    (valueIndex, optionIndex) => getValueIdentity(options[optionIndex]?.values[valueIndex]) ?? '',
  );

/**
 * Variants & pricing — options builder (up to `OPTION_LIMIT` options, chip-based value
 * entry) plus the generated variant table. This is the only section that mutates
 * `options`/`variants` via `useFieldArray` (see `productForm.schema.ts`'s shared shape).
 */
export const VariantsSection = ({
  mode,
  productId,
  media = [],
  existingVariants = [],
}: VariantsSectionProps) => {
  const t = useTranslations('Commerce.Editor.Variants');
  const tv = useTranslations('Commerce.Editor.Validation');
  const form = useFormContext<ProductFormValues>();
  const { can } = usePermissions();
  const canEdit = can('product:edit');

  // One dialog instance, controlled by which row (if any) currently has it open — mirrors the
  // approved mockup's single `modalVariantMedia` reused across every row via `pickerState`,
  // rather than mounting a dialog per row.
  const [mediaPickerIndex, setMediaPickerIndex] = useState<number | null>(null);

  const optionsFieldArray = useFieldArray({
    control: form.control,
    name: 'options',
    keyName: '_oid',
  });
  const variantsFieldArray = useFieldArray({
    control: form.control,
    name: 'variants',
    keyName: '_vid',
  });

  // `useFieldArray`'s own `fields` array only reacts to structural changes (append/remove/
  // move/replace) — per-keystroke edits to a field's value (renaming an option, typing a
  // price) don't show up there. `useWatch` is what gives us the live values needed to derive
  // variant labels and to check "is this the last active variant" correctly.
  const watchedOptions = useWatch({ control: form.control, name: 'options' }) ?? [];
  const watchedVariants = useWatch({ control: form.control, name: 'variants' }) ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleOptionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = optionsFieldArray.fields.findIndex((field) => field._oid === active.id);
    const newIndex = optionsFieldArray.fields.findIndex((field) => field._oid === over.id);
    if (oldIndex !== -1 && newIndex !== -1) optionsFieldArray.move(oldIndex, newIndex);
  };

  const addOption = () => {
    if (optionsFieldArray.fields.length >= OPTION_LIMIT) return;
    optionsFieldArray.append({ name: '', style: 'dropdown', values: [] });
  };

  // Shown on the regenerate button so the merchant sees the resulting count before clicking —
  // mirrors the mockup's "بازسازی جدول تنوع‌ها (۶ ترکیب)" label. Cheap enough to recompute on
  // every render — not worth a `useMemo` (whose dependency, `watchedOptions`, is a fresh array
  // reference from `useWatch` on every render anyway).
  const potentialVariantCount =
    watchedOptions.length === 0
      ? 1
      : watchedOptions.reduce((total, option) => total * option.values.length, 1);

  const handleRegenerate = () => {
    const options = form.getValues('options');
    const counts = options.map((option) => option.values.length);

    if (options.length > 0 && counts.some((count) => count === 0)) {
      toast.error(t('regenerateNeedsValues'));
      return;
    }

    const total = counts.length === 0 ? 1 : counts.reduce((product, count) => product * count, 1);
    if (total > VARIANT_LIMIT) {
      // Hard, blocking error — never silently cap/truncate the combination list.
      toast.error(t('regenerateLimitExceeded', { count: total }));
      return;
    }

    const combos = generateVariantCombinations(counts);
    const currentVariants = form.getValues('variants');
    // Diff key = the SORTED SET of the combination's values' stable identities (real `id` or
    // session `_localId`, never raw array position — see `getValueIdentity`/`getComboKey`).
    // Any combination that still exists after regeneration keeps its existing row (id, price,
    // SKU, stock, toggles) untouched — only combinations that are new get a fresh default row,
    // and combinations that no longer exist are dropped. This is the guard against losing a
    // merchant's already-entered prices on every options edit.
    //
    // Keying by raw position (the old approach) breaks the moment positions shift under the
    // existing rows: removing a non-last value, or reordering option rows, both shift which
    // index means what without changing the underlying values — a positional key would then
    // silently match the wrong old row to a new combo (see the regression tests below).
    const existingByKey = new Map(
      currentVariants.map((variant) => [getComboKey(variant._valueIdentities ?? []), variant]),
    );

    const nextVariants: Variant[] = combos.map((combo) => {
      const identities = getComboIdentities(combo, options);
      const existing = existingByKey.get(getComboKey(identities));
      if (existing) return { ...existing, valueIndexes: combo, _valueIdentities: identities };
      return {
        valueIndexes: combo,
        _valueIdentities: identities,
        price: 0,
        isActive: true,
        trackInventory: false,
        allowBackorder: false,
      };
    });

    variantsFieldArray.replace(nextVariants);
    toast.success(t('regenerateSuccess'));
  };

  const activeVariantCount = watchedVariants.filter((variant) => variant.isActive).length;

  const getVariantLabel = (valueIndexes: number[]) => {
    if (watchedOptions.length === 0) return t('defaultVariantLabel');
    return valueIndexes
      .map((valueIndex, optionIndex) => watchedOptions[optionIndex]?.values[valueIndex]?.value)
      .filter(Boolean)
      .join(' / ');
  };

  // Returns why a variant row's delete button should be blocked, or `null` if deletion is
  // allowed. Checked before the user hits the backend's 400, per the spec's
  // `assertHasLiveVariant` rule (at least one variant must always exist and stay active).
  const getDeleteBlockedReason = (index: number): string | null => {
    if (variantsFieldArray.fields.length <= 1) return tv('atLeastOneActiveVariantRequired');
    const variant = watchedVariants[index];
    if (variant?.isActive && activeVariantCount <= 1) return t('deleteBlockedLastActive');
    return null;
  };

  const handleRemoveVariant = (index: number) => {
    const reason = getDeleteBlockedReason(index);
    if (reason) {
      toast.error(reason);
      return;
    }
    variantsFieldArray.remove(index);
  };

  // `@hookform/resolvers`'s `toNestErrors` nests a whole-array `.superRefine`/`.refine` error
  // (path `variants`) under `errors.variants.root`, NOT directly on `errors.variants` — it
  // does this whenever the array's own item fields (`variants.0.price`, etc.) are also
  // registered, which they always are here. Reading `errors.variants.message` (the old code)
  // is therefore always `undefined`; this safety-net message never rendered. Verified against
  // the installed `@hookform/resolvers/dist/resolvers.mjs`'s `toNestErrors`.
  const arrayLevelError = (
    form.formState.errors.variants as (FieldError & { root?: FieldError }) | undefined
  )?.root?.message;

  // The media picker only ever targets a variant with a real, persisted id — `VariantRow`
  // already disables the button otherwise (see the gating comment there), so this is a
  // defensive re-check, not the primary gate.
  const mediaPickerVariantId =
    mediaPickerIndex !== null ? watchedVariants[mediaPickerIndex]?.id : undefined;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{t('optionsCardTitle')}</CardTitle>
          <p className="text-muted-foreground text-sm">{t('optionsCardDescription')}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {optionsFieldArray.fields.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleOptionDragEnd}
            >
              <SortableContext
                items={optionsFieldArray.fields.map((field) => field._oid)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-3">
                  {optionsFieldArray.fields.map((field, index) => (
                    <OptionRow
                      key={field._oid}
                      id={field._oid}
                      index={index}
                      onRemove={() => optionsFieldArray.remove(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              disabled={optionsFieldArray.fields.length >= OPTION_LIMIT}
            >
              <PlusIcon size={15} />
              {t('addOption')}
            </Button>
            <Button
              type="button"
              size="sm"
              className="ms-auto me-0"
              onClick={handleRegenerate}
              data-testid="regenerate-variants-button"
            >
              <RefreshCcwIcon size={15} />
              {t('regenerateButton', { count: potentialVariantCount })}
            </Button>
          </div>
          {optionsFieldArray.fields.length >= OPTION_LIMIT && (
            <p className="text-muted-foreground text-xs">{t('optionLimitReached')}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>{t('tableCardTitle')}</CardTitle>
            <p className="text-muted-foreground text-sm">{t('tableCardDescription')}</p>
          </div>
          <Badge variant="secondary">
            {t('variantCountBadge', { count: variantsFieldArray.fields.length })}
          </Badge>
        </CardHeader>
        <CardContent>
          {arrayLevelError && <p className="text-destructive mb-2 text-sm">{arrayLevelError}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-9"></TableHead>
                <TableHead>{t('Columns.variant')}</TableHead>
                <TableHead>{t('Columns.sku')}</TableHead>
                <TableHead>{t('Columns.price')}</TableHead>
                <TableHead>{t('Columns.compareAtPrice')}</TableHead>
                <TableHead>{t('Columns.sale')}</TableHead>
                <TableHead>{t('Columns.stock')}</TableHead>
                <TableHead>{t('Columns.trackInventory')}</TableHead>
                <TableHead>{t('Columns.allowBackorder')}</TableHead>
                <TableHead>{t('Columns.isActive')}</TableHead>
                <TableHead className="w-9"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variantsFieldArray.fields.map((field, index) => (
                <VariantRow
                  key={field._vid}
                  index={index}
                  mode={mode}
                  label={getVariantLabel(watchedVariants[index]?.valueIndexes ?? [])}
                  variantId={watchedVariants[index]?.id}
                  canEditMedia={canEdit}
                  mediaAssignment={
                    existingVariants.find((variant) => variant.id === watchedVariants[index]?.id)
                      ?.media
                  }
                  mediaPool={media}
                  existingOnHand={
                    existingVariants.find((variant) => variant.id === watchedVariants[index]?.id)
                      ?.onHand
                  }
                  deleteBlockedReason={getDeleteBlockedReason(index)}
                  isLastActiveVariant={
                    Boolean(watchedVariants[index]?.isActive) && activeVariantCount <= 1
                  }
                  onRemove={() => handleRemoveVariant(index)}
                  onOpenMediaPicker={() => setMediaPickerIndex(index)}
                />
              ))}
              {variantsFieldArray.fields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-muted-foreground">
                    {t('noVariants')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {productId && mediaPickerVariantId && (
        <VariantMediaPickerDialog
          open={mediaPickerIndex !== null}
          onOpenChange={(open) => {
            if (!open) setMediaPickerIndex(null);
          }}
          productId={productId}
          variantId={mediaPickerVariantId}
          variantLabel={getVariantLabel(
            mediaPickerIndex !== null
              ? (watchedVariants[mediaPickerIndex]?.valueIndexes ?? [])
              : [],
          )}
          pool={media}
          initialAssignment={
            existingVariants.find((variant) => variant.id === mediaPickerVariantId)?.media
          }
        />
      )}
    </div>
  );
};

const OptionRow = ({
  id,
  index,
  onRemove,
}: {
  id: string;
  index: number;
  onRemove: () => void;
}) => {
  const t = useTranslations('Commerce.Editor.Variants');
  const form = useFormContext<ProductFormValues>();
  const [valueDraft, setValueDraft] = useState('');

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const valuesFieldArray = useFieldArray({
    control: form.control,
    name: `options.${index}.values`,
    keyName: '_vxid',
  });
  const optionStyle = useWatch({ control: form.control, name: `options.${index}.style` });

  const addValue = () => {
    const trimmed = valueDraft.trim();
    if (!trimmed) return;
    // Assign the stable client-side identity the MOMENT the value is created — this is what
    // lets `VariantsSection`'s regenerate-diff (see `getValueIdentity`) recognize this exact
    // value across later edits/regenerates, before it has ever been saved (and therefore has
    // no backend `id` yet). Never sent to the backend (`buildOptionsPayload` only reads
    // `id`/`value`/`colorHex`).
    const newValue: OptionValue = { value: trimmed, _localId: crypto.randomUUID() };
    if (optionStyle === 'color') newValue.colorHex = '#cccccc';
    valuesFieldArray.append(newValue);
    setValueDraft('');
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-3 rounded-lg border p-3">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-muted-foreground mt-2 cursor-grab touch-none active:cursor-grabbing"
        aria-label={t('removeOption')}
      >
        <DotsSixVerticalIcon size={16} />
      </button>

      <div className="flex w-36 shrink-0 flex-col gap-2">
        <FormField
          control={form.control}
          name={`options.${index}.name`}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormControl>
                <Input placeholder={t('optionNamePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`options.${index}.style`}
          render={({ field }) => (
            <Select dir="rtl" value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dropdown">{t('OptionStyleOptions.dropdown')}</SelectItem>
                <SelectItem value="button">{t('OptionStyleOptions.button')}</SelectItem>
                <SelectItem value="color">{t('OptionStyleOptions.color')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        {valuesFieldArray.fields.map((valueField, valueIndex) => (
          <span
            key={valueField._vxid}
            className="bg-card inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium"
          >
            {optionStyle === 'color' && (
              <FormField
                control={form.control}
                name={`options.${index}.values.${valueIndex}.colorHex`}
                render={({ field }) => (
                  <input
                    type="color"
                    value={field.value ?? '#cccccc'}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="size-4 shrink-0 cursor-pointer rounded-full border-0 p-0"
                    aria-label={t('colorHexLabel')}
                  />
                )}
              />
            )}
            {valueField.value}
            <button
              type="button"
              onClick={() => valuesFieldArray.remove(valueIndex)}
              aria-label={t('removeValue')}
              className="text-muted-foreground opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </span>
        ))}
        <Input
          data-testid={`option-value-input-${index}`}
          value={valueDraft}
          onChange={(e) => setValueDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addValue();
            }
          }}
          placeholder={t('valueInputPlaceholder')}
          className="h-7 w-40 text-xs"
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label={t('removeOption')}
      >
        <Trash2Icon size={16} className="text-muted-foreground" />
      </Button>
    </div>
  );
};

const VariantRow = ({
  index,
  mode,
  label,
  variantId,
  canEditMedia,
  mediaAssignment,
  mediaPool,
  existingOnHand,
  deleteBlockedReason,
  isLastActiveVariant,
  onRemove,
  onOpenMediaPicker,
}: {
  index: number;
  mode: 'create' | 'edit';
  label: string;
  /** The variant's real, persisted backend id — `undefined` for a variant the merchant just
   * added this session (via "regenerate" or otherwise) that has never been saved yet. The
   * media button stays disabled until this exists, since `PUT .../variants/:variantId/media`
   * requires a real id. */
  variantId?: string;
  /** Whether the viewer holds `product:edit` — the per-variant media picker mutates the
   * product's media assignment, so the opening button must stay disabled without it, same
   * gate `VariantMediaPickerDialog#handleSave` enforces on the actual PUT. */
  canEditMedia: boolean;
  mediaAssignment?: CommerceVariantMediaAssignment;
  mediaPool: CommerceProductMedia[];
  existingOnHand?: number;
  deleteBlockedReason: string | null;
  isLastActiveVariant: boolean;
  onRemove: () => void;
  onOpenMediaPicker: () => void;
}) => {
  const t = useTranslations('Commerce.Editor.Variants');
  const form = useFormContext<ProductFormValues>();
  const { onFocus } = useSelectOnFocus();

  const salePrice = useWatch({ control: form.control, name: `variants.${index}.salePrice` });
  const saleEnabled = salePrice !== undefined;

  const toggleSale = (enabled: boolean) => {
    if (enabled) {
      form.setValue(`variants.${index}.salePrice`, 0, { shouldDirty: true });
      form.setValue(`variants.${index}.saleStartsAt`, new Date().toISOString(), {
        shouldDirty: true,
      });
    } else {
      form.setValue(`variants.${index}.salePrice`, undefined, { shouldDirty: true });
      form.setValue(`variants.${index}.saleStartsAt`, undefined, { shouldDirty: true });
      form.setValue(`variants.${index}.saleEndsAt`, undefined, { shouldDirty: true });
    }
  };

  // A brand-new variant added this session (via "regenerate" or otherwise) has no real
  // backend id yet — `PUT .../variants/:variantId/media` requires one, so the button stays
  // disabled (with an explanatory tooltip) until the whole product form is saved once, the
  // same rule `MediaSection` applies to the whole Media section pre-save. Lacking
  // `product:edit` disables it the same way, for the same reason `VariantMediaPickerDialog`'s
  // own Save button is disabled without it.
  const isMediaButtonDisabled = !variantId || !canEditMedia;
  const coverMedia = mediaAssignment?.coverMediaId
    ? mediaPool.find((item) => item.id === mediaAssignment.coverMediaId)
    : undefined;
  const coverPreviewUrl = coverMedia
    ? coverMedia.type === 'video'
      ? (coverMedia.posterUrl ?? coverMedia.url)
      : coverMedia.url
    : undefined;
  const mediaButtonTooltip = !variantId
    ? t('mediaUnsavedTooltip')
    : !canEditMedia
      ? t('mediaNoPermissionTooltip')
      : coverMedia
        ? t('mediaEditTooltip')
        : t('mediaAssignTooltip');

  return (
    <TableRow>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isMediaButtonDisabled}
                onClick={onOpenMediaPicker}
                data-testid={`variant-media-button-${index}`}
                className={cn(
                  'relative size-8 overflow-hidden',
                  !coverPreviewUrl && 'border-dashed',
                )}
              >
                {coverPreviewUrl ? (
                  <Image src={coverPreviewUrl} alt="" fill className="object-cover" sizes="32px" />
                ) : (
                  <ImageIcon size={14} />
                )}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{mediaButtonTooltip}</TooltipContent>
        </Tooltip>
      </TableCell>

      <TableCell className="text-start font-medium">{label}</TableCell>

      <TableCell>
        <FormField
          control={form.control}
          name={`variants.${index}.sku`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <Input
                  {...field}
                  data-testid={`variant-sku-${index}`}
                  value={field.value ?? ''}
                  placeholder={t('skuPlaceholder')}
                  className="h-8 w-28"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell>
        <FormField
          control={form.control}
          name={`variants.${index}.price`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <Input
                  inputMode="numeric"
                  data-testid={`variant-price-${index}`}
                  onInput={onInputP2EHandler}
                  placeholder="۰"
                  value={formatNumber(field.value ?? 0)}
                  onFocus={onFocus}
                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : +e.target.value)}
                  className="h-8 w-28"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell>
        <FormField
          control={form.control}
          name={`variants.${index}.compareAtPrice`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <Input
                  inputMode="numeric"
                  onInput={onInputP2EHandler}
                  placeholder="۰"
                  value={field.value == null ? '' : (formatNumber(field.value) ?? '')}
                  onFocus={onFocus}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? undefined : +e.target.value)
                  }
                  className="h-8 w-28"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              {saleEnabled ? t('saleToggleLabel') + ' ✓' : t('saleToggleLabel')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex w-64 flex-col gap-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('saleToggleLabel')}</span>
              <Switch checked={saleEnabled} onCheckedChange={toggleSale} />
            </div>

            {saleEnabled && (
              <>
                <FormField
                  control={form.control}
                  name={`variants.${index}.salePrice`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <span className="text-muted-foreground text-xs">{t('salePriceLabel')}</span>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          onInput={onInputP2EHandler}
                          placeholder="۰"
                          value={field.value == null ? '' : (formatNumber(field.value) ?? '')}
                          onFocus={onFocus}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? undefined : +e.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.saleStartsAt`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <span className="text-muted-foreground text-xs">
                        {t('saleStartsAtLabel')}
                      </span>
                      <DatePicker
                        date={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date ? date.toISOString() : undefined)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.saleEndsAt`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <span className="text-muted-foreground text-xs">{t('saleEndsAtLabel')}</span>
                      <DatePicker
                        date={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date ? date.toISOString() : undefined)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </PopoverContent>
        </Popover>
      </TableCell>

      <TableCell>
        {mode === 'create' ? (
          <FormField
            control={form.control}
            name={`variants.${index}.initialStock`}
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input
                    inputMode="numeric"
                    onInput={onInputP2EHandler}
                    placeholder="۰"
                    value={field.value == null ? '' : (formatNumber(field.value) ?? '')}
                    onFocus={onFocus}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : +e.target.value)
                    }
                    className="h-8 w-20"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <span>{formatNumber(existingOnHand ?? 0)}</span>
            <span className="text-muted-foreground text-[10px] whitespace-normal">
              {t('stockReadonlyNote')}
            </span>
          </div>
        )}
      </TableCell>

      <TableCell>
        <FormField
          control={form.control}
          name={`variants.${index}.trackInventory`}
          render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
        />
      </TableCell>

      <TableCell>
        <FormField
          control={form.control}
          name={`variants.${index}.allowBackorder`}
          render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
        />
      </TableCell>

      <TableCell>
        <div className="flex flex-col items-center gap-1">
          <FormField
            control={form.control}
            name={`variants.${index}.isActive`}
            render={({ field }) => (
              <Switch
                data-testid={`variant-active-${index}`}
                checked={field.value}
                disabled={isLastActiveVariant}
                onCheckedChange={field.onChange}
              />
            )}
          />
          {isLastActiveVariant && (
            <span className="text-muted-foreground w-20 text-center text-[10px] whitespace-normal">
              {t('deactivateBlockedLastActive')}
            </span>
          )}
        </div>
      </TableCell>

      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                data-testid={`variant-delete-${index}`}
                disabled={Boolean(deleteBlockedReason)}
                onClick={onRemove}
                aria-label={t('deleteVariant')}
              >
                <Trash2Icon size={14} className="text-destructive" />
              </Button>
            </span>
          </TooltipTrigger>
          {deleteBlockedReason && <TooltipContent>{deleteBlockedReason}</TooltipContent>}
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};
