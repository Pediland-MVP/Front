'use client';
import NextError from 'next/error';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// After a new deploy, a browser tab that was already open still references the
// old JS chunk hashes, which 404 once the previous build's files are gone. A
// single reload fetches the current build's HTML/chunk manifest and clears it.
// The timestamp guard stops a repeat failure (e.g. offline) from reload-looping.
const CHUNK_RELOAD_GUARD_KEY = 'chunkLoadErrorReloadAt';
const CHUNK_RELOAD_GUARD_WINDOW_MS = 10_000;

function isChunkLoadError(error: Error) {
  return (
    error.name === 'ChunkLoadError' ||
    /Failed to load chunk|Loading chunk .* failed/i.test(error.message)
  );
}

function reloadOnceForChunkError() {
  const lastReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) ?? 0);
  if (Date.now() - lastReloadAt < CHUNK_RELOAD_GUARD_WINDOW_MS) return false;

  sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, String(Date.now()));
  window.location.reload();
  return true;
}

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    const reloaded = isChunkLoadError(error) && reloadOnceForChunkError();
    Sentry.captureException(error, { tags: { chunkLoadAutoReload: reloaded } });
  }, [error]);

  return (
    <html>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
