/**
 * True only for a same-origin relative path that is safe to hand to
 * `router.push` / `router.replace`. Used to sanitize `returnTo`-style values
 * that come from the URL query string, so a crafted link can't redirect an
 * authenticated user off-site.
 *
 * Rejects everything a browser could normalize into an off-site or
 * protocol-relative URL:
 * - must start with a single `/` (relative path)
 * - not `//…` (protocol-relative → `//evil.example`)
 * - not `/\…` and no backslashes anywhere (browsers turn `\` into `/`, so
 *   `/\evil.example` normalizes to `//evil.example`)
 * - no whitespace/control chars (the URL parser strips `\t\n\r`, which can be
 *   used to smuggle a `//` past a naive prefix check)
 */
export function isSafeInternalPath(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//') || value.startsWith('/\\')) return false;
  if (/[\\\s]/.test(value)) return false;
  return true;
}
