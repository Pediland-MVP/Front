import type {
  CommerceCategory,
  CommerceOptionStyle,
  CommerceProductDetail,
} from '@/types/commerce';
import type { ProductFormValues } from './productEditor.schema';

/**
 * The translation layer between the catalog API and the form.
 *
 * Three disagreements live here and nowhere else:
 *
 * 1. The backend identifies a variant's selection POSITIONALLY (`valueIndexes[i]` is an index
 *    into `options[i].values`); the form holds stable value keys. Positions are derived once,
 *    here, against the very options array this payload just built — never stored — so an axis or
 *    a value can be reordered without the rows silently pointing somewhere else.
 * 2. `trackInventory` is the inverse of the ∞ toggle the design draws.
 * 3. `PUT /commerce/products/:id` REPLACES the whole variants array. Seven variant fields have no
 *    control in this design, so they are loaded into the form and written straight back out.
 *    Without that, saving from this page would clear every SKU in the catalogue.
 */

type FormOption = ProductFormValues['options'][number];
type FormValue = FormOption['values'][number];

interface OptionValuePayload {
  id?: string;
  value: string;
  colorHex?: string;
}

interface OptionPayload {
  id?: string;
  name: string;
  style: CommerceOptionStyle;
  values: OptionValuePayload[];
}

interface VariantPayload {
  id?: string;
  valueIndexes: number[];
  sku?: string;
  price: number;
  compareAtPrice?: number;
  salePrice?: number;
  saleStartsAt?: string;
  saleEndsAt?: string;
  isActive: boolean;
  trackInventory: boolean;
  allowBackorder: boolean;
  weight?: number;
  initialStock?: number;
}

export interface CreateProductPayload {
  title: string;
  description: string;
  status: 'active';
  kind: 'physical';
  shippingCost: 0;
  categoryId?: string;
  collectionIds: string[];
  tags: string[];
  specs: Array<{ title: string; body: string }>;
  options: OptionPayload[];
  variants: VariantPayload[];
}

/**
 * The update payload IS the create payload minus the keys this page must not send: `status`,
 * `kind` and `shippingCost` have no control in the design (spec decision 1) and the backend
 * treats a missing key as "leave unchanged"; `collectionIds` is not part of the update DTO at
 * all, because membership is owned by the collection side once the product has an id.
 */
export type UpdateProductPayload = Omit<
  CreateProductPayload,
  'status' | 'kind' | 'shippingCost' | 'collectionIds'
> & { cascadeDeleteVariants: true };

export interface CategoryTreeNode {
  id: string;
  name: string;
  subs: Array<{ id: string; name: string }>;
}

const byPosition = <T extends { position: number }>(a: T, b: T): number => a.position - b.position;

/**
 * How a variant refers to one of its option values. A value the server knows has an id; one typed
 * this session only has the local key the form minted for it. Both sides of the mapping — the
 * loaded rows and the position lookup — must agree on this, so it is one function.
 */
export const valueKeyOf = (value: { id?: string; localKey: string }): string =>
  value.id ?? value.localKey;

/**
 * Only options that have at least one value take part in the combination space, exactly like
 * `variantTree.axesOf`. Restated here rather than imported because that helper's `TreeAxis`
 * requires a non-optional `id`, which a freshly typed option does not have.
 */
const axesOfValues = (options: FormOption[]): FormOption[] =>
  options.filter((option) => option.values.length > 0);

export const mapDetailToFormValues = (product: CommerceProductDetail): ProductFormValues => {
  const options = [...product.options].sort(byPosition).map((option) => ({
    id: option.id,
    // On load the local key mirrors the server id: already unique and stable, and it keeps this
    // mapper pure — minting a random key here would make the same response map differently twice.
    localKey: option.id,
    name: option.name,
    style: option.style,
    values: [...option.values].sort(byPosition).map((value) => ({
      id: value.id,
      localKey: value.id,
      value: value.value,
      // The DTO's colorHex is optional with a length rule; null would fail it on the way back.
      colorHex: value.colorHex ?? undefined,
    })),
  }));

  const axes = axesOfValues(options);
  const axisOfValue = new Map<string, number>();
  axes.forEach((axis, axisIndex) => {
    axis.values.forEach((value) => axisOfValue.set(valueKeyOf(value), axisIndex));
  });

  /**
   * `optionValueIds` comes back in join order, which is not necessarily axis order, while every
   * rule downstream (comboKey, roll-up, valueIndexes) reads the array positionally. A slot left
   * empty means the row points at a value that is gone — it stays short so `orphanRowIndexes`
   * flags it instead of it quietly resolving to the wrong axis.
   */
  const orderByAxis = (ids: string[]): string[] => {
    const slots: Array<string | null> = new Array(axes.length).fill(null);
    ids.forEach((id) => {
      const axisIndex = axisOfValue.get(id);
      if (axisIndex != null) slots[axisIndex] = id;
    });
    return slots.filter((id): id is string => id != null);
  };

  return {
    title: product.title,
    description: product.description ?? '',
    categoryId: product.categoryId ?? null,
    // `?? []` on both: a rolling deploy can still answer with a response shaped from before tags
    // and specs existed, and a missing key must load as "none", not crash the editor.
    tags: product.tags ?? [],
    specs: (product.specs ?? []).map((spec) => ({ title: spec.title, body: spec.body })),
    // Membership is not on the product detail; `useProductLoad` derives it from the collections
    // list and fills it in after this runs.
    collectionIds: [],
    // The media pool is form state only so the variant media picker can resolve an id to a url.
    // It is never sent in a product payload — media has its own endpoints.
    // Left empty ON PURPOSE. The API's CommerceProductMedia and the form's EditorMedia are
    // different shapes (position/alt/posterUrl vs name/url/isPending), and the page shell is
    // already the thing that owns the pool — it queues create-mode Files into the same array.
    // Normalising in one place there beats doing it in two.
    media: [],
    // Steps ۵ and ۶ are seeds for generating rows. Once variants exist they mean nothing, so a
    // loaded product always starts them blank rather than showing a number it would not persist.
    basePrice: null,
    baseCompare: null,
    baseStock: null,
    options,
    variants: [...product.variants].sort(byPosition).map((variant) => ({
      id: variant.id,
      valueIds: orderByAxis(variant.optionValueIds),
      price: variant.price,
      compare: variant.compareAtPrice,
      // Seeded from the data, because the backend has no such column — a row that arrives with a
      // compare price IS discounted. Seeding it here (rather than deriving on render) is what
      // lets the merchant clear the cell without the discount switching itself off underneath.
      hasDiscount: variant.compareAtPrice != null,
      // An untracked variant has no count to show; ∞ is the UI for it.
      stock: variant.trackInventory ? variant.onHand : null,
      infinite: !variant.trackInventory,
      mediaIds: variant.media?.selectedMediaIds ?? [],
      // No UI below this line — carried so the write-back does not erase them.
      sku: variant.sku,
      weight: variant.weight,
      salePrice: variant.salePrice,
      saleStartsAt: variant.saleStartsAt,
      saleEndsAt: variant.saleEndsAt,
      allowBackorder: variant.allowBackorder,
      isActive: variant.isActive,
    })),
  };
};

/**
 * `GET /commerce/categories` answers with a FLAT list; the picker draws two levels.
 *
 * A category whose `parentId` points at something not in the list (parent deleted, or filtered
 * out) is shown as a root — otherwise it would be unreachable and the merchant could never move
 * a product off it.
 */
export const mapCategoriesToTree = (categories: CommerceCategory[]): CategoryTreeNode[] => {
  const known = new Set(categories.map((cat) => cat.id));
  const sorted = [...categories].sort(byPosition);

  return sorted
    .filter((cat) => cat.parentId == null || !known.has(cat.parentId))
    .map((root) => ({
      id: root.id,
      name: root.name,
      // Direct children only. A third level exists in the data model but not in this picker, so
      // it is dropped rather than flattened into the wrong parent.
      subs: sorted
        .filter((cat) => cat.parentId === root.id)
        .map((cat) => ({ id: cat.id, name: cat.name })),
    }));
};

const buildOptionsPayload = (options: FormOption[]): OptionPayload[] =>
  options.map((option) => ({
    // Spread-or-nothing, never `id: undefined`: the key must be ABSENT for a row created this
    // session, so the backend inserts it instead of trying to match an id it has never seen.
    ...(option.id ? { id: option.id } : {}),
    name: option.name.trim(),
    style: option.style,
    values: option.values.map((value: FormValue) => ({
      ...(value.id ? { id: value.id } : {}),
      value: value.value.trim(),
      ...(value.colorHex ? { colorHex: value.colorHex } : {}),
    })),
  }));

const buildVariantsPayload = (values: ProductFormValues, axes: FormOption[]): VariantPayload[] => {
  // Built from the SAME axes array the options payload was built from — that is the whole reason
  // the form stores stable keys instead of the positions themselves.
  const positionOf = axes.map(
    (axis) =>
      new Map<string, number>(
        axis.values.map((value, index): [string, number] => [valueKeyOf(value), index]),
      ),
  );

  const out: VariantPayload[] = [];

  for (const variant of values.variants) {
    const valueIndexes = axes.map(
      (_axis, axisIndex) => positionOf[axisIndex].get(variant.valueIds[axisIndex] ?? '') ?? -1,
    );
    // A row whose selection no longer resolves is stale (`useVariantSync` normally removes it
    // first). Sending -1 would be a 500; dropping it writes exactly what the merchant can see.
    if (valueIndexes.some((index) => index < 0)) continue;

    out.push({
      ...(variant.id ? { id: variant.id } : {}),
      valueIndexes,
      ...(variant.sku ? { sku: variant.sku } : {}),
      // zod rejects a null price before submit (a variant row must have one), so by the time a
      // payload is built every surviving row has a real number. No placeholder is ever invented.
      price: variant.price as number,
      ...(variant.compare != null ? { compareAtPrice: variant.compare } : {}),
      ...(variant.salePrice != null ? { salePrice: variant.salePrice } : {}),
      ...(variant.saleStartsAt ? { saleStartsAt: variant.saleStartsAt } : {}),
      ...(variant.saleEndsAt ? { saleEndsAt: variant.saleEndsAt } : {}),
      isActive: variant.isActive,
      trackInventory: !variant.infinite,
      allowBackorder: variant.allowBackorder,
      ...(variant.weight != null ? { weight: variant.weight } : {}),
      // An ∞ row has no count to set, so `initialStock` is left out entirely rather than sent
      // as 0 — which would look like a deliberate "set this to zero" ledger write.
      ...(!variant.infinite && variant.stock != null ? { initialStock: variant.stock } : {}),
    });
  }

  return out;
};

export const buildCreatePayload = (values: ProductFormValues): CreateProductPayload => {
  const axes = axesOfValues(values.options);
  return {
    title: values.title.trim(),
    description: values.description,
    // The design has no status, kind or shipping control (spec decision 1) and create requires
    // status and kind, so the page commits to the only product it can actually draw.
    status: 'active',
    kind: 'physical',
    shippingCost: 0,
    // `categoryId` is validated as a UUID: null would be rejected, so "no category" is the key
    // being absent.
    ...(values.categoryId ? { categoryId: values.categoryId } : {}),
    // Create is the one moment membership can be written from this side — the product has no id
    // yet, so the collection endpoint is not available.
    collectionIds: values.collectionIds,
    tags: values.tags,
    specs: values.specs,
    options: buildOptionsPayload(axes),
    variants: buildVariantsPayload(values, axes),
  };
};

export const buildUpdatePayload = (values: ProductFormValues): UpdateProductPayload => {
  const axes = axesOfValues(values.options);
  return {
    title: values.title.trim(),
    description: values.description,
    ...(values.categoryId ? { categoryId: values.categoryId } : {}),
    tags: values.tags,
    specs: values.specs,
    options: buildOptionsPayload(axes),
    variants: buildVariantsPayload(values, axes),
    // The editor always sends the complete desired set of options and variants, so any row the
    // backend would have to drop is one the merchant already deleted on screen. Without this the
    // save is blocked the moment an option value with dependent variants is removed.
    cascadeDeleteVariants: true,
  };
};
