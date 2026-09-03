import type {
  CommerceShippingKind,
  CommerceShippingOption,
  CommerceShippingSettlement,
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
 * `settlement` is carried through as one value rather than unpacked into booleans. The API models
 * it as a single exclusive enum precisely so a method cannot claim two modes at once, and
 * flattening it here would reintroduce the contradiction the enum exists to prevent.
 *
 * `freeOverAmount` stays `null` when the seller never waives shipping. That is a real distinction
 * from `0`, which means always free — so it is a nullable amount, not a checkbox plus a number
 * that could disagree with it.
 */
export interface ShippingOptionDraft {
  key: string;
  /** `null` for a row added on screen that has never been POSTed. */
  serverId: string | null;
  kind: CommerceShippingKind;
  title: string;
  isActive: boolean;
  settlement: CommerceShippingSettlement;
  amount: number;
  freeOverAmount: number | null;
  sortOrder: number;
  /** Seeded by the platform: the merchant may edit it, but the API refuses to delete it. */
  isSystem: boolean;
  overrides: ShippingOverrideDraft[];
}

/**
 * Whether the seller is the one charging for delivery. Under freight collect the carrier bills the
 * buyer, and under cash on delivery the carrier collects at the door and keeps the freight — so in
 * both, a rate, a threshold and per-destination exceptions are all meaningless.
 *
 * `pickup` («تحویل حضوری») is the third case, and it is a KIND rather than a settlement because
 * the two answer different questions: settlement is who pays the carrier and when, and in-person
 * collection has no carrier at all. It charges nothing whatever settlement is left on it — the
 * server enforces the same rule in `ShippingService`, and this mirrors it so the screen never
 * shows a price the buyer will not be asked for.
 */
export const chargesShipping = (draft: Pick<ShippingOptionDraft, 'kind' | 'settlement'>) =>
  draft.kind !== 'pickup' && draft.settlement === 'prepaid';

/** Server row → editable draft. */
export function toDraft(option: CommerceShippingOption): ShippingOptionDraft {
  return {
    key: option.id,
    serverId: option.id,
    kind: option.kind,
    title: option.title,
    isActive: option.isActive,
    settlement: option.settlement,
    amount: option.amount,
    freeOverAmount: option.freeOverAmount,
    sortOrder: option.sortOrder,
    isSystem: option.isSystem,
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
    kind: 'post_express',
    title,
    isActive: true,
    settlement: 'prepaid',
    amount: 0,
    freeOverAmount: null,
    sortOrder,
    // A method the merchant is adding is theirs, so it stays deletable. The server hard-codes the
    // same thing on create -- this is never sent.
    isSystem: false,
    overrides: [],
  };
}

/**
 * Draft → create/update body.
 *
 * The rate is normalised here as well as on the server: an amount sent alongside a carrier that
 * collects would be contradictory input the API silently zeroes. Better that the request says
 * exactly what the screen means.
 */
export function toPayload(draft: ShippingOptionDraft): CreateShippingOptionPayload {
  const charges = chargesShipping(draft);

  return {
    kind: draft.kind,
    title: draft.title.trim(),
    settlement: draft.settlement,
    amount: charges ? draft.amount : 0,
    freeOverAmount: charges ? draft.freeOverAmount : null,
    sortOrder: draft.sortOrder,
    isActive: draft.isActive,
  };
}

/**
 * Draft → overrides body. A carrier-collected option sends an empty list: the API rejects
 * overrides on it outright, and any rows left over from before the mode changed must be cleared,
 * not kept.
 */
export function toOverridesPayload(draft: ShippingOptionDraft): SetRateOverridesPayload {
  if (!chargesShipping(draft)) return { overrides: [] };

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
    payload.settlement !== original.settlement ||
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
