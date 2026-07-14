import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      // `next/image` is only resolvable inside a Next.js app; stub it for components (e.g.
      // MediaUploader) that are shared into packages/ui but only ever run inside Next apps.
      'next/image': path.resolve(dirname, './test/stubs/next-image.tsx'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['node_modules'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
