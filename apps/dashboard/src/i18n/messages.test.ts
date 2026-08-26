import { describe, expect, it } from 'vitest';

import faMessages from '../messages/fa.json';
import faErrorCodes from '../messages/fa/ErrorCodes.json';

// Regression guard for a shallow-merge shadowing bug: `i18n/request.ts` merges
// `messages/fa.json` and `messages/fa/ErrorCodes.json` with a shallow spread, so
// whichever file's `ERROR_CODES` object is spread last (ErrorCodes.json) wins
// *entirely* — any `ERROR_CODES` keys that only exist in the monolithic
// `fa.json` never reach the user. New error-code translations must be added to
// `messages/fa/ErrorCodes.json`, not `messages/fa.json`.
//
// This has already shipped silently once: 23 `COMMERCE_*` translations were added
// to `fa.json` alone and were dead at runtime. The `no key ... is shadowed` test
// below is the general guard; it fails on *any* future key added to the wrong file.
describe('fa/ErrorCodes.json', () => {
  const errorCodes = faErrorCodes.ERROR_CODES as Record<string, string>;
  const shadowable = faMessages.ERROR_CODES as Record<string, string>;

  it('is the file that wins the shallow merge, so nothing in fa.json is shadowed', () => {
    const shadowed = Object.keys(shadowable).filter((key) => !(key in errorCodes));

    expect(shadowed).toEqual([]);
  });

  it('translates every key to a non-empty string', () => {
    const blank = Object.entries(errorCodes)
      .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
      .map(([key]) => key);

    expect(blank).toEqual([]);
  });

  const keys = [
    'SECOND_INSTAGRAM_REQUIRES_SUBSCRIPTION',
    'USERNAME_REQUIRED',
    'INSTAGRAM_LOOKUP_COOLDOWN',
    'COMMERCE_OUT_OF_STOCK',
    'COMMERCE_ORDER_STATUS_CHANGED',
    'COMMERCE_INSUFFICIENT_STOCK_ON_APPROVAL',
  ];

  it.each(keys)('defines a translation for %s', (key) => {
    expect(errorCodes).toHaveProperty(key);
    expect(typeof errorCodes[key]).toBe('string');
  });
});
