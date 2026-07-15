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
