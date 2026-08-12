// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const isProd = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: 'https://3840b928a474bc5e496bfebfef3da2ab@o4510601348448256.ingest.de.sentry.io/4510601398911056',

  // Off in dev. The server SDK wires OpenTelemetry auto-instrumentation through
  // import-in-the-middle / require-in-the-middle, which hooks every module load
  // in the dev server.
  enabled: isProd,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: isProd ? 1 : 0,

  // Enable logs to be sent to Sentry
  enableLogs: isProd,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
