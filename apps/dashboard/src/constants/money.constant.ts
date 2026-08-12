/**
 * Largest money amount (in Toman) the backend accepts for a product price or discount.
 *
 * Must stay in sync with `MAX_MONEY_AMOUNT` in
 * `Back/apps/core/src/common/constants/money.const.ts`. The backend rejects anything above
 * this with `PRODUCT_PRICE_TOO_LARGE` / `PRODUCT_DISCOUNT_PRICE_TOO_LARGE`; checking it here
 * too just means the user finds out while typing instead of after a failed save.
 */
export const MAX_MONEY_AMOUNT = 999_999_999_999;
