/**
 * Shared client-side validity check for a carrier tracking URL, used by both `ShipOrderDialog`
 * and `EditTrackingDialog` -- they must stay identical (M5 finding: two copies of the same rule
 * is how one silently drifts from the other and from the server).
 *
 * `new URL()` alone accepts `javascript:alert(1)` as a perfectly valid URL, so the parsed
 * `protocol` is checked explicitly rather than inferred from a successful parse. The server's
 * `@IsUrl` (class-validator) additionally requires a TLD-bearing host, so `https://localhost:8080`
 * parses fine here but 400s on the server -- the extra `hostname` check below closes that gap so
 * the dialog never accepts something the backend is guaranteed to reject.
 */
export const isValidTrackingUrl = (value: string): boolean => {
  let parsed: URL | null = null;
  try {
    parsed = new URL(value);
  } catch {
    parsed = null;
  }
  if (!parsed) return false;
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  // Mirrors class-validator's `@IsUrl` host requirement: a bare hostname with no dot (e.g.
  // `localhost`) is rejected by the server, so it must be rejected here too.
  if (!parsed.hostname.includes('.')) return false;
  return true;
};
