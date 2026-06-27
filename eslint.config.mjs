import { FlatCompat } from '@eslint/eslintrc';
import eslintConfigPrettier from 'eslint-config-prettier';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/**
 * Root ESLint config for the Front monorepo — the single source of truth.
 *
 * Flat config resolves from the current working directory and searches
 * upward, so this one file serves both `eslint .` at the repo root
 * (lint-staged / CI) and lint runs inside each app. Next 16 removed
 * `next lint`, so apps lint via the ESLint CLI against this config.
 *
 * `next.rootDir` is pointed at both apps so the Next plugin's page-aware
 * rules resolve correctly from the monorepo root.
 */
export default [
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/next-env.d.ts',
      'worktrees/**',
      '**/*.config.{js,mjs,cjs,ts}',
    ],
  },
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
    settings: { next: { rootDir: ['apps/dashboard/', 'apps/admin/'] } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  }),
  // --- Adoption baseline -----------------------------------------------------
  // These rules currently fail on pre-existing code. They are downgraded to
  // warnings so CI is green on day one WITHOUT hiding them (they still show in
  // lint output). They are real and should be fixed, then re-escalated to
  // "error" one rule at a time. Do NOT add new violations.
  {
    rules: {
      '@typescript-eslint/no-namespace': 'warn',
      'react/jsx-no-undef': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'react/jsx-key': 'warn',
      'prefer-const': 'warn',
      'react/no-unescaped-entities': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      'no-var': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
    },
  },
  // Formatting is owned by Prettier — keep this last.
  eslintConfigPrettier,
];
