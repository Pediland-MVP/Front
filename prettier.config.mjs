/**
 * Single source of truth for formatting across the Front monorepo.
 * Prettier resolves config by walking up the directory tree, so every app and
 * package inherits this automatically — do not add per-app .prettierrc files.
 *
 * @type {import("prettier").Config}
 */
export default {
  printWidth: 100,
  tabWidth: 2,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
};
