/**
 * Chunk-load recovery.
 *
 * A JS/CSS chunk can fail to download — a flaky mobile/VPN link to Cloudflare,
 * or a tab left open across a deploy whose old chunk hashes are gone. It shows
 * up in three places:
 *  1. during a React render or client navigation -> `app/global-error.tsx`
 *     (the dashboard's only error boundary);
 *  2. outside React, e.g. an `import()` in a click handler -> an unhandled
 *     promise rejection;
 *  3. before React starts: a `<script>` in the server HTML fails. Turbopack's
 *     runtime only attaches an `error` listener to scripts already in the page,
 *     so a script that failed before that leaves its chunk promise pending
 *     forever. The user sits on AuthProvider's server-rendered spinner and
 *     nothing reaches Sentry.
 *
 * Only code that runs before any chunk can see (3), so the recovery is an
 * inline `<head>` script (CHUNK_RELOAD_SCRIPT, rendered by `app/layout.tsx`).
 * It also exposes `window.__befChunkReload` for (1).
 *
 * It reloads the page at most MAX_RELOADS times per RELOAD_WINDOW_MS per tab,
 * so a network that is really down cannot reload-loop. The reason is kept in
 * sessionStorage and reported to Sentry on the next load (instrumentation-
 * client.ts), because the reload would cut off an in-flight Sentry request.
 */

export const CHUNK_ERROR_PATTERN = [
  'Failed to load chunk', // Turbopack
  'Loading chunk \\S+ failed', // webpack
  'Loading CSS chunk', // webpack (css)
  'ChunkLoadError',
  'Importing a module script failed', // Safari, native import()
  'error loading dynamically imported module', // Firefox, native import()
].join('|');

export const CHUNK_RELOAD_GUARD_KEY = 'befChunkReload';
export const CHUNK_RELOAD_REASON_KEY = 'befChunkReloadReason';
export const MAX_RELOADS = 2;
export const RELOAD_WINDOW_MS = 60_000;

// Plain ES5 on purpose: it runs before any bundle, so nothing is transpiled or polyfilled.
export const CHUNK_RELOAD_SCRIPT = `(function () {
  var re = new RegExp(${JSON.stringify(CHUNK_ERROR_PATTERN)}, 'i');
  var pending = false;
  function reload(reason) {
    if (pending) return true;
    try {
      var now = Date.now();
      var guard = JSON.parse(sessionStorage.getItem(${JSON.stringify(CHUNK_RELOAD_GUARD_KEY)}) || 'null');
      if (!guard || now - guard.t > ${RELOAD_WINDOW_MS}) guard = { t: now, n: 0 };
      if (guard.n >= ${MAX_RELOADS}) return false;
      guard.n += 1;
      sessionStorage.setItem(${JSON.stringify(CHUNK_RELOAD_GUARD_KEY)}, JSON.stringify(guard));
      sessionStorage.setItem(${JSON.stringify(CHUNK_RELOAD_REASON_KEY)}, String(reason).slice(0, 300));
    } catch (e) {
      return false;
    }
    pending = true;
    window.location.reload();
    return true;
  }
  window.__befChunkReload = reload;
  window.addEventListener('error', function (e) {
    var el = e.target;
    if (el && el !== window && el.tagName) {
      var isScript = el.tagName === 'SCRIPT';
      var isStylesheet = el.tagName === 'LINK' && el.rel === 'stylesheet';
      var url = el.src || el.href || '';
      if ((isScript || isStylesheet) && url.indexOf('/_next/static/chunks/') !== -1) {
        reload('resource ' + url);
      }
      return;
    }
    if (e.message && re.test(e.message)) reload(e.message);
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    var message = r ? r.message || String(r) : '';
    if (re.test(message)) reload(message);
  });
})();`;

declare global {
  interface Window {
    __befChunkReload?: (reason: string) => boolean;
  }
}

const chunkErrorRegex = new RegExp(CHUNK_ERROR_PATTERN, 'i');

export function isChunkLoadError(error: unknown): boolean {
  const { name, message } = (error ?? {}) as { name?: string; message?: string };
  return name === 'ChunkLoadError' || chunkErrorRegex.test(message ?? '');
}

/** Reload through the inline script's loop guard. Returns whether a reload was started. */
export function reloadForChunkError(reason: string): boolean {
  if (typeof window === 'undefined' || typeof window.__befChunkReload !== 'function') return false;
  return window.__befChunkReload(reason);
}

/** Read-and-clear the reason stored by the reload that led to this page load. */
export function takeChunkReloadReason(): string | null {
  try {
    const reason = sessionStorage.getItem(CHUNK_RELOAD_REASON_KEY);
    if (reason) sessionStorage.removeItem(CHUNK_RELOAD_REASON_KEY);
    return reason;
  } catch {
    return null;
  }
}
