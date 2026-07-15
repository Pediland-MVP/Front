import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // These mirror tsconfig.json's `paths` overrides that redirect certain `@/...`
      // specifiers into the shared `packages/ui` sources (the automation-builder move,
      // Tasks 15-20). tsconfig `paths` only affect tsc/Next.js's webpack resolution, not
      // Vite/vitest, so without these the same specifiers 404 under `vitest run`. More
      // specific entries must come before the generic `@` catch-all below.
      {
        find: '@/lib/utils',
        replacement: path.resolve(dirname, '../../packages/ui/src/lib/utils.ts'),
      },
      {
        find: '@/components/ui-custom',
        replacement: path.resolve(dirname, '../../packages/ui/src/components/ui-custom'),
      },
      {
        find: '@/components/ui',
        replacement: path.resolve(dirname, '../../packages/ui/src/components/ui'),
      },
      {
        find: '@/automation-builder',
        replacement: path.resolve(dirname, '../../packages/ui/src/automation-builder'),
      },
      { find: '@', replacement: path.resolve(dirname, './src') },
      // `packages/ui` (a workspace package, not a Next.js app) doesn't declare `next` as
      // a dependency, so pnpm's strict resolution means `next/image`/`next/link` 404 when
      // vitest loads its files (e.g. InstagramPostSelectDialog.tsx) — even though the
      // *dashboard* app itself has a real `next`. Reuse the same stubs packages/ui's own
      // vitest.config.ts already uses for this, rather than duplicating them.
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
