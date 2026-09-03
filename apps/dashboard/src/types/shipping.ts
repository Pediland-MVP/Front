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
  | 'post_express'
  | 'post_registered'
  | 'tipax'
  | 'courier'
  | 'pickup'
  | 'other';

/**
 * Who pays what, and when. Exactly one per method — a method cannot be two of these at once, which
 * is why it is one value rather than flags that could contradict each other.
 *
 * | mode               | buyer pays at checkout | `shippingTotal` | settled           |
 * | ------------------ | ---------------------- | --------------- | ----------------- |
 * | `prepaid`          | goods + shipping       | the quoted rate | at submit         |
 * | `freight_collect`  | goods only             | 0               | at submit         |
 * | `cash_on_delivery` | nothing                | 0               | seller marks paid |
 *
 * Only `prepaid` has a rate the seller charges, so `amount`, `freeOverAmount` and the whole
 * per-destination override list are meaningful only there.
 */
export type CommerceShippingSettlement = 'prepaid' | 'freight_collect' | 'cash_on_delivery';

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
  settlement: CommerceShippingSettlement;
  amount: number;
  freeOverAmount: number | null;
  /** Where the buyer collects, for a `pickup` method. `null` on every other kind, and on a pickup
   *  whose address the merchant has not typed yet. */
  pickupAddress: string | null;
  sortOrder: number;
  isActive: boolean;
  /**
   * One of the starter methods the platform seeds into every workspace. Editable like any other —
   * rename, reprice, re-settle, switch off — but the API refuses to DELETE it
   * (`COMMERCE_SHIPPING_OPTION_NOT_DELETABLE`), so no shop can end up with no way to ship.
   */
  isSystem: boolean;
  /** Eager-loaded by `GET /commerce/shipping-options`; there is no separate overrides route. */
  overrides: CommerceShippingRateOverride[];
  createDate: string;
  updateDate: string;
}

export interface CreateShippingOptionPayload {
  kind: CommerceShippingKind;
  title: string;
  settlement: CommerceShippingSettlement;
  amount?: number;
  freeOverAmount?: number | null;
  pickupAddress?: string | null;
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
