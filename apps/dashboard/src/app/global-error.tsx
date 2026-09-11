'use client';
import NextError from 'next/error';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { isChunkLoadError, reloadForChunkError } from '@/utils/chunkReload';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    // A chunk that failed to download mid-render or mid-navigation lands here. A reload
    // fetches it again (or, after a deploy, the new build's chunks); the loop guard lives
    // in the inline script — see utils/chunkReload.ts.
    const reloaded =
      isChunkLoadError(error) && reloadForChunkError(`global-error ${error.message}`);
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
