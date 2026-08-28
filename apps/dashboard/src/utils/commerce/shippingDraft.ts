import type {
  CommerceShippingKind,
  CommerceShippingOption,
  CommerceShippingPricing,
  CreateShippingOptionPayload,
  SetRateOverridesPayload,
} from '@/types/shipping';

/** One price exception while it is being edited on screen. */
export interface ShippingOverrideDraft {
  /** Stable local identity for React keys and edits; a saved row reuses its server id. */
  key: string;
  kind: 'city' | 'province';
  /** City id or province id, depending on `kind`. */
  id: number;
  amount: number;
}

/**
 * One shipping option while it is being edited.
 *
 * The three-way `pricing` enum is flattened into two independent booleans because that is how the
 * screen presents it: a پس‌کرایه switch and a free-shipping-threshold switch. `pricingOf` folds
 * them back into the single enum the API takes, and enforces the exclusion the DB constraint also
 * enforces — پس‌کرایه wins, because when the courier bills the buyer the seller's own price and
 * threshold are meaningless.
 */
export interface ShippingOptionDraft {
  key: string;
  /** `null` for a row added on screen that has never been POSTed. */
  serverId: string | null;
  kind: CommerceShippingKind;
  title: string;
  isActive: boolean;
  postKerayeh: boolean;
  freeOverEnabled: boolean;
  amount: number;
  freeOverAmount: number;
  sortOrder: number;
  overrides: ShippingOverrideDraft[];
}

export function pricingOf(draft: ShippingOptionDraft): CommerceShippingPricing {
  if (draft.postKerayeh) return 'post_kerayeh';
  return draft.freeOverEnabled ? 'free_over' : 'flat';
}

/** Server row → editable draft. */
export function toDraft(option: CommerceShippingOption): ShippingOptionDraft {
  return {
    key: option.id,
    serverId: option.id,
    kind: option.kind,
    title: option.title,
    isActive: option.isActive,
    postKerayeh: option.pricing === 'post_kerayeh',
    freeOverEnabled: option.pricing === 'free_over',
    amount: option.amount,
    // Keep a usable number in the field even when the mode is off, so flipping the switch on does
    // not present an empty box. `pricingOf` decides whether it is ever sent.
    freeOverAmount: option.freeOverAmount ?? 0,
    sortOrder: option.sortOrder,
    overrides: (option.overrides ?? []).map((o) => ({
      key: o.id,
      kind: o.cityId != null ? 'city' : 'province',
      id: (o.cityId ?? o.provinceId) as number,
      amount: o.amount,
    })),
  };
}

let draftCounter = 0;

/** A brand-new option, not yet on the server. */
export function newOptionDraft(title: string, sortOrder: number): ShippingOptionDraft {
  draftCounter += 1;
  return {
    key: `draft-${draftCounter}`,
    serverId: null,
    kind: 'post_pishtaz',
    title,
    isActive: true,
    postKerayeh: false,
    freeOverEnabled: false,
    amount: 0,
    freeOverAmount: 0,
    sortOrder,
    overrides: [],
  };
}

/**
 * Draft → create/update body.
 *
 * `amount` and `freeOverAmount` are normalised here as well as on the server: sending an amount
 * alongside `post_kerayeh` would be contradictory input, and the API would silently zero it —
 * better that the request says exactly what the screen means.
 */
export function toPayload(draft: ShippingOptionDraft): CreateShippingOptionPayload {
  const pricing = pricingOf(draft);

  return {
    kind: draft.kind,
    title: draft.title.trim(),
    pricing,
    amount: pricing === 'post_kerayeh' ? 0 : draft.amount,
    freeOverAmount: pricing === 'free_over' ? draft.freeOverAmount : null,
    sortOrder: draft.sortOrder,
    isActive: draft.isActive,
  };
}

/**
 * Draft → overrides body. A پس‌کرایه option sends an empty list: the API rejects overrides on it
 * outright, and any rows left from before the switch was flipped have to be cleared, not kept.
 */
export function toOverridesPayload(draft: ShippingOptionDraft): SetRateOverridesPayload {
  if (pricingOf(draft) === 'post_kerayeh') return { overrides: [] };

  return {
    overrides: draft.overrides.map((o) => ({
      cityId: o.kind === 'city' ? o.id : null,
      provinceId: o.kind === 'province' ? o.id : null,
      amount: o.amount,
    })),
  };
}

/** Whether the option's own columns differ from what the server last returned. */
export function isOptionDirty(draft: ShippingOptionDraft, original: CommerceShippingOption) {
  const payload = toPayload(draft);

  return (
    payload.kind !== original.kind ||
    payload.title !== original.title ||
    payload.pricing !== original.pricing ||
    payload.amount !== original.amount ||
    (payload.freeOverAmount ?? null) !== (original.freeOverAmount ?? null) ||
    payload.sortOrder !== original.sortOrder ||
    payload.isActive !== original.isActive
  );
}

/**
 * Whether the exception list differs. Order-insensitive: the server returns rows in whatever order
 * the insert produced, and reordering alone must not count as a change the merchant has to save.
 */
export function areOverridesDirty(draft: ShippingOptionDraft, original: CommerceShippingOption) {
  const next = toOverridesPayload(draft).overrides;
  const previous = original.overrides ?? [];

  if (next.length !== previous.length) return true;

  const asKey = (o: { cityId?: number | null; provinceId?: number | null; amount: number }) =>
    `${o.cityId ?? 'x'}:${o.provinceId ?? 'x'}:${o.amount}`;

  const previousKeys = new Set(previous.map(asKey));
  return next.some((o) => !previousKeys.has(asKey(o)));
}
