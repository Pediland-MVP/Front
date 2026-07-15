import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror tsconfig.json's `paths` overrides: the more specific `@/components/ui`,
    // `@/lib/utils`, and `@/automation-builder` entries point into packages/ui (shared
    // components), and must be matched before the general `@/*` -> src fallback.
    alias: [
      {
        find: /^@\/components\/ui$/,
        replacement: path.resolve(dirname, '../../packages/ui/src/components/ui/index.ts'),
      },
      {
        find: /^@\/components\/ui\/(.*)/,
        replacement: path.resolve(dirname, '../../packages/ui/src/components/ui') + '/$1',
      },
      {
        find: /^@\/components\/ui-custom\/(.*)/,
        replacement: path.resolve(dirname, '../../packages/ui/src/components/ui-custom') + '/$1',
      },
      {
        find: /^@\/lib\/utils$/,
        replacement: path.resolve(dirname, '../../packages/ui/src/lib/utils.ts'),
      },
      {
        find: /^@\/components\/automation-builder$/,
        replacement: path.resolve(dirname, '../../packages/ui/src/automation-builder/index.ts'),
      },
      {
        find: /^@\/components\/automation-builder\/(.*)/,
        replacement: path.resolve(dirname, '../../packages/ui/src/automation-builder') + '/$1',
      },
      {
        find: /^@\/automation-builder$/,
        replacement: path.resolve(dirname, '../../packages/ui/src/automation-builder/index.ts'),
      },
      {
        find: /^@\/automation-builder\/(.*)/,
        replacement: path.resolve(dirname, '../../packages/ui/src/automation-builder') + '/$1',
      },
      { find: /^@\/(.*)/, replacement: path.resolve(dirname, './src') + '/$1' },
      // `packages/ui` (a workspace package, not a Next.js app) doesn't declare `next` as a
      // dependency, so pnpm's strict resolution means `next/image`/`next/link` 404 when
      // vitest loads its files (e.g. `InstagramPostSelectDialog.tsx`, rendered by the
      // shared `AutomationBuilder`) — even though the admin app itself has a real `next`.
      // Reuse the same stubs `packages/ui`'s own vitest.config.ts and the dashboard's
      // vitest.config.ts already use for this, rather than duplicating them.
      {
        find: 'next/image',
        replacement: path.resolve(dirname, '../../packages/ui/test/stubs/next-image.tsx'),
      },
      {
        find: 'next/link',
        replacement: path.resolve(dirname, '../../packages/ui/test/stubs/next-link.tsx'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['node_modules', 'e2e'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
