// Submit-time link normalization. These run as zod `.transform()`s on form schemas, so
// the user's input is never rewritten while they type — only the submitted payload is.
//
// NOTE: this is unrelated to `sanitizeUrl` in ./markdown.ts, which is a render-time XSS
// guard (it blocks `javascript:` schemes when building HTML). This file only upgrades
// the scheme of links the user typed.

const HTTP_SCHEME = /^http:\/\//i;
const HTTPS_SCHEME = /^https:\/\//i;

/**
 * For fields whose ENTIRE value is a link (button URLs).
 *
 * Callers must validate with REGEX_URL first, which is what makes the bare-domain
 * branch safe: by the time this runs, the value is already known to be domain-shaped.
 */
export function httpsUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (HTTP_SCHEME.test(trimmed)) return `https://${trimmed.slice('http://'.length)}`;
  if (HTTPS_SCHEME.test(trimmed)) return trimmed;
  return `https://${trimmed}`; // bare domain, e.g. `shop.ir` or `www.shop.ir/a`
}

/**
 * For free text that may CONTAIN links (message bodies).
 *
 * Deliberately does NOT prepend https to bare domains, unlike `httpsUrl`. Nothing
 * validates free text, so a bare-domain rule here would wrongly rewrite `index.js`,
 * `فایل.zip`, or a decimal like `1.5`. Only explicit `http://` is upgraded.
 */
export function httpsInText(text: string): string {
  return text.replace(/http:\/\//gi, 'https://');
}
