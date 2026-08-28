/**
 * Merchant-owned shipping options and their sparse per-destination price exceptions.
 *
 * Mirrors `Back` `packages/entities/src/commerce/commerceShipping*` and the DTOs of
 * `apps/core/src/commerce/shipping/`. Kept as hand-written types rather than generated ones
 * because `lib/api/v1.d.ts` is regenerated from the deployed spec, which does not yet know
 * about these routes.
 */

/** Platform-owned and closed: adding a value is a Back migration, never a frontend change. */
export type CommerceShippingKind =
  | 'post_pishtaz'
  | 'post_sefareshi'
  | 'tipax'
  | 'courier'
  | 'pickup'
  | 'other';

/**
 * How one option prices a delivery. Deliberately three-way and mutually exclusive:
 * - `flat` — one default amount, plus any per-city/province overrides.
 * - `free_over` — same, but waived entirely once the basket reaches `freeOverAmount`.
 * - `post_kerayeh` — the courier bills the buyer on delivery. The seller is not party to that
 *   money, so `amount` is forced to 0, `freeOverAmount` to null, and overrides are rejected.
 */
export type CommerceShippingPricing = 'flat' | 'free_over' | 'post_kerayeh';

/**
 * A price exception for one destination. Exactly one of `cityId`/`provinceId` is set — the DB
 * enforces it with `CHK_commerce_shipping_override_target`.
 */
export interface CommerceShippingRateOverride {
  id: string;
  shippingOptionId: string;
  cityId: number | null;
  provinceId: number | null;
  amount: number;
}

export interface CommerceShippingOption {
  id: string;
  workspaceId: string;
  kind: CommerceShippingKind;
  title: string;
  pricing: CommerceShippingPricing;
  amount: number;
  freeOverAmount: number | null;
  sortOrder: number;
  isActive: boolean;
  /** Eager-loaded by `GET /commerce/shipping-options`; there is no separate overrides route. */
  overrides: CommerceShippingRateOverride[];
  createDate: string;
  updateDate: string;
}

export interface CreateShippingOptionPayload {
  kind: CommerceShippingKind;
  title: string;
  pricing: CommerceShippingPricing;
  amount?: number;
  freeOverAmount?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

/** Every field optional: the Back only touches a column whose key was actually sent. */
export type UpdateShippingOptionPayload = Partial<CreateShippingOptionPayload>;

export interface RateOverridePayload {
  cityId?: number | null;
  provinceId?: number | null;
  amount: number;
}

/** `PUT :id/overrides` is a full replace — send the whole list, not a diff. Capped at 200. */
export interface SetRateOverridesPayload {
  overrides: RateOverridePayload[];
}

/** Max overrides one option may carry, enforced by `SetRateOverridesDto`'s `@ArrayMaxSize`. */
export const MAX_RATE_OVERRIDES = 200;
