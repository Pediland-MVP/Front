# Postal Code Answer Validation for Automation QUESTION Content (2026-08-02)

Paired Back branch: `feat/question-image-validation` (same branch name in both repos — added
alongside the `Image` validation type on the same branch/day).

## Problem

The automation builder's Question content step had no `validationType` option to require the
lead's DM reply to be a valid Iranian postal code.

## Solution

Added `PostalCode` to `ValidationTypeEnum`, mirroring the Back change. As with every text-based
validation type, no new dropdown-rendering logic was needed — only a default error message and
translation labels.

## Changes

- `packages/ui/src/automation-builder/types/validationType.enum.ts` — added
  `PostalCode = 'postalCode'`.
- `packages/ui/src/automation-builder/Contents/QuestionContent.tsx` — `getDefaultErrorMessage`
  gained a `PostalCode` case ("کد پستی شما صحیح نیست").
- `apps/dashboard/src/messages/fa.json` **and** `apps/admin/src/messages/fa.json` — both
  updated with `Automations.Contents.Question.validationType.items.postalCode` →
  `"کد پستی"`. Both apps updated together this time, since the earlier `Image` feature (same
  day) missed the admin copy and needed a follow-up review fix — not repeating that here.
- No zod schema change needed (`z.nativeEnum(ValidationTypeEnum)` auto-includes the new value).

## Verification

- No frontend test run and no manual browser verification performed for this change.
- Both `fa.json` files verified as valid JSON after edits.
