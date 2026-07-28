import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react';
import { useFieldArray, useFormContext, type FieldArrayWithId } from 'react-hook-form';

import { valueKeyOf } from '../productEditor.mapping';
import { MAX_VARIANTS, type ProductFormValues } from '../productEditor.schema';
import {
  axesOf,
  comboKey,
  missingCombos,
  orphanRowIndexes,
  realignValueIds,
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

/**
 * Backend cap (`@ArrayMaxSize(2000)` on the variants array). Generation stops here.
 *
 * Re-exported, not redeclared: the zod schema enforces the same ceiling, and if the two ever
 * drifted `syncVariants` would happily generate rows that validation then rejects — with nothing
 * the merchant could do about it, because they never asked for those rows in the first place.
 */
export { MAX_VARIANTS };

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
 * Form options → tree axes.
 *
 * The key of an option or a value is `id ?? localKey`, NEVER `id` alone. Until the product is
 * saved nothing has a backend id — `AttributesSection` mints only a `localKey` — and
 * `variants[].valueIds` are built from that same rule (`valueKeyOf`). Keying on `id` made this
 * return `[]` for every brand-new product, so `combosOf` had nothing to expand and `syncVariants`
 * generated no rows at all: the variation table simply never appeared in CREATE mode, and a value
 * added during an EDIT session was dropped from its axis.
 *
 * A half-typed option still falls away, because `axesOf` drops any option with no values.
 */
export const axesOfOptions = (options: ProductFormValues['options']): TreeAxis[] =>
  axesOf(
    (options ?? []).map((option) => ({
      id: option.id ?? option.localKey,
      values: option.values
        .map((value) => ({ id: valueKeyOf(value) }))
        .filter((value) => Boolean(value.id)),
    })),
  );

/**
 * Everything a generated row is seeded with — INCLUDING the seven fields this design draws no
 * control for and the backend row id itself.
 *
 * Carrying them is not a nicety. `buildUpdatePayload` sends `cascadeDeleteVariants: true` and
 * `PUT /commerce/products/:id` replaces the whole variants array, so a regenerated row that
 * arrives without an `id` is a DELETE of the old variant plus an INSERT of a blank one: the sku
 * is gone, the weight is gone, the sale window is gone, and a variant the merchant deliberately
 * deactivated comes back `isActive: true` — on sale again, silently, because the price carried
 * over so the grid looks unchanged.
 */
interface RowSeed {
  /** The backend row this seed came from. Absent ⇒ the backend mints a new one. */
  id?: string;
  price: number | null;
  compare: number | null;
  stock: number | null;
  infinite: boolean;
  mediaIds: string[];
  sku: string | null;
  weight: number | null;
  salePrice: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  allowBackorder: boolean;
  isActive: boolean;
}

/** What a row with no donor at all starts from — a genuinely new combination. */
const BLANK_SEED = {
  sku: null,
  weight: null,
  salePrice: null,
  saleStartsAt: null,
  saleEndsAt: null,
  allowBackorder: false,
  isActive: true,
} as const;

const buildRow = (valueIds: string[], seed: RowSeed): VariantRow => ({
  // Spread-or-nothing, never `id: undefined`: `buildVariantsPayload` keys off the property being
  // ABSENT to decide insert-vs-update.
  ...(seed.id ? { id: seed.id } : {}),
  valueIds,
  price: seed.price,
  compare: seed.compare,
  stock: seed.stock,
  infinite: seed.infinite,
  mediaIds: seed.mediaIds,
  sku: seed.sku,
  weight: seed.weight,
  salePrice: seed.salePrice,
  saleStartsAt: seed.saleStartsAt,
  saleEndsAt: seed.saleEndsAt,
  allowBackorder: seed.allowBackorder,
  isActive: seed.isActive,
});

export const useVariantSync = (): VariantSync => {
  const { control, getValues } = useFormContext<ProductFormValues>();

  // `keyName: 'key'`, not the default `'id'`: a variant HAS its own `id` (the backend row), and
  // the default would overwrite it in `fields` with a generated uuid — losing which rows already
  // exist server-side.
  const { fields, append, remove, update } = useFieldArray<ProductFormValues, 'variants', 'key'>({
    control,
    name: 'variants',
    keyName: 'key',
  });

  const suppressedRef = useRef<Set<string>>(new Set());
  const shapeRef = useRef<string>('');

  const syncVariants = useCallback((): VariantSyncResult => {
    const values = getValues();
    const axes = axesOfOptions(values.options ?? []);
    const rows = [...((values.variants ?? []) as VariantRow[])];

    const shape = axes.map((axis) => axis.id).join('|');
    if (shape !== shapeRef.current) {
      shapeRef.current = shape;
      suppressedRef.current.clear();
    }

    /**
     * STEP 0 — a pure axis REORDER is a permutation, not a regeneration.
     *
     * `valueIds` is positional, so moving "رنگ" above "سایز" leaves every row's array in the old
     * order and `orphanRowIndexes` flags ALL of them. Regenerating from that would hand every row
     * a new identity: the ids go, and with `cascadeDeleteVariants` the backend deletes the real
     * variants and inserts blanks — one "move up" click wipes every SKU in the product.
     *
     * So the rows are re-sorted in place first. Nothing is added, nothing is removed, no id is
     * ever at risk. `update` rather than `setValue` because `useFieldArray`'s own `fields`
     * snapshot is what the grid groups and labels off; a `setValue` would leave it showing the
     * old axis order.
     */
    rows.forEach((row, index) => {
      const current = row.valueIds ?? [];
      const aligned = realignValueIds(axes, current);
      if (!aligned || comboKey(aligned) === comboKey(current)) return;
      const moved = { ...row, valueIds: aligned };
      rows[index] = moved;
      update(index, moved);
    });

    const orphans = orphanRowIndexes(axes, rows);
    const orphanSet = new Set(orphans);
    const orphanRows = orphans.map((index) => rows[index]);
    const survivors = rows.filter((_row, index) => !orphanSet.has(index));

    const missing = missingCombos(axes, survivors, [...suppressedRef.current]);
    const room = Math.max(0, MAX_VARIANTS - survivors.length);
    const wanted = missing.slice(0, room);

    /**
     * A row whose combination no longer exists is not thrown away — the rows that REPLACE it
     * inherit from it. The match has to work in BOTH directions, because an axis edit can make
     * the combination longer or shorter:
     *
     *   - GROW (an axis was added): the old row's ids are a subset of the richer combination.
     *     `['قرمز']` donates to `['قرمز','S']` and `['قرمز','M']`.
     *   - SHRINK (an axis was removed): the target combination is a subset of the old row's ids.
     *     `['قرمز','S']` donates to `['قرمز']`.
     *
     * Only the grow direction used to be tested for, so removing one of two axes found no donor
     * at all and every row fell back to `basePrice`/`baseCompare`/`baseStock` — which
     * `mapDetailToFormValues` deliberately leaves null on a loaded product. Six priced variants
     * came back blank, zod then blocked Save, and the merchant's work was only recoverable
     * through بازگردانی.
     */
    const donorOf = (combo: string[]): VariantRow | undefined =>
      orphanRows.find((row) => {
        const ids = row.valueIds ?? [];
        if (!ids.length) return false;
        return ids.every((id) => combo.includes(id)) || combo.every((id) => ids.includes(id));
      });

    const hadRows = survivors.length > 0;
    /**
     * One donor can feed several combinations (`['قرمز']` → S, M, L), and three can collapse onto
     * one. Whatever is an IDENTITY or a QUANTITY may therefore only go to the first taker:
     *
     *   - `id`  — two rows carrying the same variant id would be one insert and one silent loss;
     *             the first taker keeps the real row (and with it its inventory ledger), the rest
     *             are genuinely new variants.
     *   - `sku` — a stock keeping unit names one sellable thing. Copying it across sizes would
     *             produce duplicates that no warehouse can act on.
     *   - `stock` — a count is a quantity, not a template. Same rule `baseStock` follows.
     *
     * Everything else (price, compare, media, weight, the sale window, allowBackorder, isActive
     * and the ∞ flag) describes the product and is copied to every row the donor feeds.
     */
    const claimed = new Set<VariantRow>();

    const created = wanted.map((combo, position) => {
      const donor = donorOf(combo);
      if (!donor) {
        return buildRow(combo, {
          ...BLANK_SEED,
          price: values.basePrice ?? null,
          compare: values.baseCompare ?? null,
          // baseStock seeds the first row ever generated and nothing else.
          stock: !hadRows && position === 0 ? (values.baseStock ?? null) : null,
          infinite: false,
          mediaIds: [],
        });
      }
      const isFirstTaker = !claimed.has(donor);
      claimed.add(donor);
      return buildRow(combo, {
        id: isFirstTaker ? donor.id : undefined,
        sku: isFirstTaker ? donor.sku : null,
        stock: isFirstTaker ? donor.stock : null,
        price: donor.price,
        compare: donor.compare,
        // Not gated on `isFirstTaker`: ∞ is a tracking MODE, not a count. Dropping it left the
        // extra rows reading "no stock" instead of "untracked".
        infinite: donor.infinite,
        mediaIds: [...(donor.mediaIds ?? [])],
        weight: donor.weight,
        salePrice: donor.salePrice,
        saleStartsAt: donor.saleStartsAt,
        saleEndsAt: donor.saleEndsAt,
        allowBackorder: donor.allowBackorder,
        isActive: donor.isActive,
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
  }, [append, getValues, remove, update]);

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
