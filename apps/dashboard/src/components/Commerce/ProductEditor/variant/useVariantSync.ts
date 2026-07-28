import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react';
import { useFieldArray, useFormContext, type FieldArrayWithId } from 'react-hook-form';

import type { ProductFormValues } from '../productEditor.schema';
import {
  axesOf,
  comboKey,
  missingCombos,
  orphanRowIndexes,
  type TreeAxis,
} from './variantTree.util';

/**
 * Keeps `variants` in step with `options`.
 *
 * READ THIS BEFORE CHANGING ANYTHING HERE.
 *
 * The source design regenerates every missing combination inside `render`, which means a row the
 * merchant deletes is recreated on the very next render — its delete buttons look broken. So:
 *
 *   - regeneration NEVER runs in a `useEffect` watching `options`. It runs in `syncVariants()`,
 *     which `AttributesSection` calls explicitly after an axis edit (add value, remove value,
 *     add axis, remove axis, reorder). An effect would reintroduce exactly the bug we are here
 *     to avoid, because a deletion is itself a change to `variants` and would retrigger it.
 *   - a deleted combination is remembered in `suppressedRef` and passed to `missingCombos`, so
 *     it is not regenerated.
 *
 * The suppression list is CLEARED when the axis set changes shape (an axis added, removed or
 * reordered). `comboKey` is order-sensitive — the axis order is part of the key space — so after
 * a reshape the old keys describe combinations that no longer exist and would silently suppress
 * unrelated new ones.
 */

/** Backend cap (`@ArrayMaxSize(2000)` on the variants array). Generation stops here. */
export const MAX_VARIANTS = 2000;

export type VariantRow = ProductFormValues['variants'][number];

/** `keyName: 'key'` — see `useVariantSync` for why it is not the default `'id'`. */
export type VariantField = FieldArrayWithId<ProductFormValues, 'variants', 'key'>;

export interface VariantSyncResult {
  added: number;
  removed: number;
  /** true when the 2000-variant ceiling cut the generation short. */
  capped: boolean;
}

export interface VariantSync {
  fields: VariantField[];
  syncVariants: () => VariantSyncResult;
  /** Deletes rows AND remembers them, so the next sync does not bring them back. */
  removeRows: (indexes: number[]) => void;
  /** Forget every remembered deletion — used after a form `reset()` (load / revert / save). */
  resetSuppressed: () => void;
}

/**
 * Form options → tree axes. An option or value with no id is not an axis yet: `AttributesSection`
 * mints a local id the moment one is created, so this only skips a half-typed row.
 */
export const axesOfOptions = (options: ProductFormValues['options']): TreeAxis[] =>
  axesOf(
    (options ?? [])
      .filter((option): option is (typeof options)[number] & { id: string } => Boolean(option.id))
      .map((option) => ({
        id: option.id,
        values: option.values
          .filter((value): value is (typeof option.values)[number] & { id: string } =>
            Boolean(value.id),
          )
          .map((value) => ({ id: value.id })),
      })),
  );

interface RowSeed {
  price: number | null;
  compare: number | null;
  stock: number | null;
  infinite: boolean;
  mediaIds: string[];
}

/**
 * A row created this session has no `id` — the backend mints it. The seven fields with no UI in
 * this design still have to exist, because `PUT` replaces the whole variants array.
 */
const buildRow = (valueIds: string[], seed: RowSeed): VariantRow => ({
  valueIds,
  price: seed.price,
  compare: seed.compare,
  stock: seed.stock,
  infinite: seed.infinite,
  mediaIds: seed.mediaIds,
  sku: null,
  weight: null,
  salePrice: null,
  saleStartsAt: null,
  saleEndsAt: null,
  allowBackorder: false,
  isActive: true,
});

export const useVariantSync = (): VariantSync => {
  const { control, getValues } = useFormContext<ProductFormValues>();

  // `keyName: 'key'`, not the default `'id'`: a variant HAS its own `id` (the backend row), and
  // the default would overwrite it in `fields` with a generated uuid — losing which rows already
  // exist server-side.
  const { fields, append, remove } = useFieldArray<ProductFormValues, 'variants', 'key'>({
    control,
    name: 'variants',
    keyName: 'key',
  });

  const suppressedRef = useRef<Set<string>>(new Set());
  const shapeRef = useRef<string>('');

  const syncVariants = useCallback((): VariantSyncResult => {
    const values = getValues();
    const axes = axesOfOptions(values.options ?? []);
    const rows = (values.variants ?? []) as VariantRow[];

    const shape = axes.map((axis) => axis.id).join('|');
    if (shape !== shapeRef.current) {
      shapeRef.current = shape;
      suppressedRef.current.clear();
    }

    const orphans = orphanRowIndexes(axes, rows);
    const orphanSet = new Set(orphans);
    const orphanRows = orphans.map((index) => rows[index]);
    const survivors = rows.filter((_row, index) => !orphanSet.has(index));

    const missing = missingCombos(axes, survivors, [...suppressedRef.current]);
    const room = Math.max(0, MAX_VARIANTS - survivors.length);
    const wanted = missing.slice(0, room);

    /**
     * A row that predates a new axis is not thrown away. The combinations that extend it inherit
     * its price, compare and media — the design calls this `migrateRows`. Its stock goes to the
     * FIRST one only, for the same reason `baseStock` does: a count is a quantity, not a template.
     * The old row itself has to go: its combination no longer exists.
     */
    const donorOf = (combo: string[]): VariantRow | undefined =>
      orphanRows.find(
        (row) => row.valueIds.length > 0 && row.valueIds.every((id) => combo.includes(id)),
      );

    const hadRows = survivors.length > 0;
    const stockClaimed = new Set<VariantRow>();

    const created = wanted.map((combo, position) => {
      const donor = donorOf(combo);
      if (!donor) {
        return buildRow(combo, {
          price: values.basePrice ?? null,
          compare: values.baseCompare ?? null,
          // baseStock seeds the first row ever generated and nothing else.
          stock: !hadRows && position === 0 ? (values.baseStock ?? null) : null,
          infinite: false,
          mediaIds: [],
        });
      }
      const takesStock = !stockClaimed.has(donor);
      stockClaimed.add(donor);
      return buildRow(combo, {
        price: donor.price,
        compare: donor.compare,
        stock: takesStock ? donor.stock : null,
        infinite: takesStock ? donor.infinite : false,
        mediaIds: [...(donor.mediaIds ?? [])],
      });
    });

    if (orphans.length) remove(orphans);
    // `shouldFocus: false` — generation is a side effect of editing an axis input up in step ۷;
    // stealing focus down into the grid would interrupt the merchant mid-sentence.
    if (created.length) append(created, { shouldFocus: false });

    return {
      added: created.length,
      removed: orphans.length,
      capped: missing.length > wanted.length,
    };
  }, [append, getValues, remove]);

  const removeRows = useCallback(
    (indexes: number[]) => {
      if (!indexes.length) return;
      const rows = (getValues('variants') ?? []) as VariantRow[];
      indexes.forEach((index) => {
        const row = rows[index];
        if (row) suppressedRef.current.add(comboKey(row.valueIds));
      });
      remove(indexes);
    },
    [getValues, remove],
  );

  const resetSuppressed = useCallback(() => {
    suppressedRef.current.clear();
    shapeRef.current = '';
  }, []);

  return { fields, syncVariants, removeRows, resetSuppressed };
};

/**
 * One instance, shared. `AttributesSection` (step ۷) calls `syncVariants`, `VariantsSection`
 * (step ۹) renders `fields` and calls `removeRows` — they must see the SAME suppression list, so
 * the hook is created once at the page level and read from context.
 *
 * Built with `createElement` rather than JSX so this stays a `.ts` file next to the pure rules.
 */
const VariantSyncContext = createContext<VariantSync | null>(null);

export function VariantSyncProvider({ children }: { children: ReactNode }) {
  const value = useVariantSync();
  return createElement(VariantSyncContext.Provider, { value }, children);
}

export const useVariantSyncContext = (): VariantSync => {
  const value = useContext(VariantSyncContext);
  if (!value) throw new Error('useVariantSyncContext must be used inside <VariantSyncProvider>');
  return value;
};
