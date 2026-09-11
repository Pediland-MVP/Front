/**
 * Shared client-side validity check for a carrier follow-up (tracking) CODE, used by both
 * `ShipOrderDialog` and `EditTrackingDialog` -- they must stay identical (M5 finding: two copies
 * of the same rule is how one silently drifts from the other and from the server).
 *
 * Mirrors Back's `@Matches(/^[A-Za-z0-9-]+$/)` + `@MaxLength(50)` (`ShipOrderDto`/
 * `UpdateTrackingDto`) exactly -- English letters, digits and hyphens only, so the dialog never
 * accepts something the backend is guaranteed to reject. No carrier-specific format is enforced:
 * Iran Post, Tipax, and every other courier a seller might use have different code shapes, so the
 * only requirement is "safe to paste back into a tracker".
 *
 * **This replaced the earlier `isValidTrackingUrl` (`trackingUrl.util.ts`, deleted) on
 * 2026-09-06** — the value is a post office/courier tracking CODE now, never a carrier URL.
 */
export const isValidFollowUpCode = (value: string): boolean =>
  value.length > 0 && value.length <= 50 && /^[A-Za-z0-9-]+$/.test(value);

/**
 * Persian/Arabic digits → English, mirroring Back's `p2eNumbers` (`ShipOrderDto`/
 * `UpdateTrackingDto`'s `@Transform`) -- CLAUDE.md §18's "every mostly-numeric field" rule
 * applied to a field that's usually a courier's numeric or alphanumeric code.
 *
 * Deliberately NOT the dashboard's own `p2eNumber.ts` default export: that one strips every
 * non-digit character (`replace(/[^0-9]/g, '')`), which is correct for a pure-number field like a
 * price but would delete the English LETTERS a follow-up code can contain (e.g. `RA123456785IR`).
 * This one only rewrites digits and leaves everything else untouched.
 */
export const normalizeFollowUpCodeInput = (value: string): string =>
  value
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
