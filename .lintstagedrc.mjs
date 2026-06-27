export default {
  // Lint + format code. eslint runs from the repo root against the root config.
  '*.{ts,tsx,js,jsx,mjs,cjs}': ['eslint --fix --no-warn-ignored', 'prettier --write'],
  // Format everything else Prettier understands.
  '*.{json,md,yml,yaml,css}': ['prettier --write'],
};
