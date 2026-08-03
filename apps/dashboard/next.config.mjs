import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },

  experimental: {
    // `@phosphor-icons/react` has no per-icon entry in Next's built-in optimize
    // list, and its barrel re-exports ~3025 modules (1512 CSR + 1513 SSR). Dev
    // does not tree-shake, so every one of our ~119 import sites pulled the whole
    // set. Listing it here makes Next rewrite the barrel import to the single
    // icon module instead. `@befroosh/ui` gets the same treatment for its
    // 29-component barrel behind the `@/components/ui` alias.
    optimizePackageImports: ['@phosphor-icons/react', '@befroosh/ui'],
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: 'pcfcdn.kommo.com' },
      { protocol: 'https', hostname: 'miro.medium.com' },
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: 'koochaa-cdn.s3.**.amazonaws.com' },
      { protocol: 'https', hostname: 'koochaa-cdn.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'cdn.zarinpal.com' },
      { protocol: 'https', hostname: 'befroosh.app' },
      { protocol: 'https', hostname: 'befroosh.s3.ir-thr-at1.arvanstorage.ir' },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'befroosh',

  project: 'my',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
