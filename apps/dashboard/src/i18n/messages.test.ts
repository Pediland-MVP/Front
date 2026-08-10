import { describe, expect, it } from 'vitest';

import faErrorCodes from '../messages/fa/ErrorCodes.json';

// Regression guard for a shallow-merge shadowing bug: `i18n/request.ts` merges
// `messages/fa.json` and `messages/fa/ErrorCodes.json` with a shallow spread, so
// whichever file's `ERROR_CODES` object is spread last (ErrorCodes.json) wins
// *entirely* — any `ERROR_CODES` keys that only exist in the monolithic
// `fa.json` never reach the user. New error-code translations must be added to
// `messages/fa/ErrorCodes.json`, not `messages/fa.json`.
describe('fa/ErrorCodes.json', () => {
  const keys = [
    'SECOND_INSTAGRAM_REQUIRES_SUBSCRIPTION',
    'USERNAME_REQUIRED',
    'INSTAGRAM_LOOKUP_COOLDOWN',
  ];

  it.each(keys)('defines a translation for %s', (key) => {
    expect(faErrorCodes.ERROR_CODES).toHaveProperty(key);
    expect(typeof (faErrorCodes.ERROR_CODES as Record<string, string>)[key]).toBe('string');
  });
});
