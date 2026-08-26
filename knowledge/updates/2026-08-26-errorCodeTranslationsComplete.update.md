# 2026-08-26 — Complete Persian translations for every backend error code

Reference: `knowledge/front-back-relations.md` (error-code contract),
`apps/dashboard/src/i18n/request.ts` (message merge), `apps/dashboard/src/i18n/messages.test.ts` (guard).

## Problem

Two problems, one of them silent.

1. **Coverage.** The backend `ERROR_CODES` union (Back `packages/common` +
   `apps/core/src/common/classes/exceptionMessage.ts`) declares **241** codes. The dashboard
   translated only part of them, so `t_ec(code)` fell through to the raw English `message`
   for the rest.

2. **A shadowing trap (the silent one).** `i18n/request.ts` builds the message bundle with a
   **shallow** spread:

   ```ts
   messages: {
     ...(await import(`../messages/${locale}.json`)).default,
     ...(await import(`../messages/${locale}/Auth.json`)).default,
     ...(await import(`../messages/${locale}/ErrorCodes.json`)).default,
     ...(await import(`../messages/${locale}/Console.json`)).default,
   }
   ```

   Both `messages/fa.json` and `messages/fa/ErrorCodes.json` define an `ERROR_CODES` object.
   A shallow spread replaces the whole object, so **`fa/ErrorCodes.json` wins entirely** and
   every key that lives only in `fa.json` is dead at runtime.

   This had already shipped: **23 `COMMERCE_*` translations** added to `fa.json` alone were
   never reachable by `t_ec`. The user still saw the raw English backend message.

## Solution

- `messages/fa/ErrorCodes.json` is the single source of truth for `ERROR_CODES`. It now holds
  **253** keys — all 241 backend codes plus 12 frontend-only ones
  (`FETCH_DATA`, `CONNECTION_ERROR`, `LOAD_FAILED`, …).
- The 23 shadowed `COMMERCE_*` translations were moved into it verbatim, so their wording is
  unchanged — they simply became reachable.
- `messages/fa.json` keeps its `ERROR_CODES` block untouched: several component tests import
  `@/messages/fa.json` directly and build their own `NextIntlClientProvider` from it. Every key
  it holds also exists in `fa/ErrorCodes.json`, so tests and runtime now agree.
- Per `CLAUDE.md` §8 only `fa.json` needs new text, so `messages/en/ErrorCodes.json` is unchanged.

## Changes

| File | Change |
| --- | --- |
| `apps/dashboard/src/messages/fa/ErrorCodes.json` | 184 → 253 keys (+23 rescued `COMMERCE_*`, +46 new) |
| `apps/dashboard/src/i18n/messages.test.ts` | hardcoded 3-key spot check → general shadowing + non-empty guards |

### The guard

The old test pinned three key names. It could not catch a *new* key added to the wrong file.
It now asserts the invariant directly:

```ts
it('is the file that wins the shallow merge, so nothing in fa.json is shadowed', () => {
  const shadowed = Object.keys(shadowable).filter((key) => !(key in errorCodes));
  expect(shadowed).toEqual([]);
});
```

Any future `ERROR_CODES` key added to `fa.json` alone now fails CI instead of silently going dead.

## Verification

- `npx vitest run src/i18n/messages.test.ts` — 8/8 pass.
- `npx vitest run src/i18n src/components/Commerce` — 23 files, **258 tests pass**.
- Coverage proven by script against the real backend sources: parse both `ERROR_CODES` unions
  and every `new ExceptionMessage({ code: '…' })` in `apps/core/src` → 241 codes;
  **0 missing** from `fa/ErrorCodes.json`, **0 shadowed** keys left in `fa.json`.

## Rule going forward

**New backend error code → add the key to `apps/dashboard/src/messages/fa/ErrorCodes.json`.**
Never to `messages/fa.json` — it is shadowed.
