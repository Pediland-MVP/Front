# Image-Only Answer Validation for Automation QUESTION Content (2026-08-02)

Paired Back branch: `feat/question-image-validation` (same branch name in both repos).

## Problem

The automation builder's "Question" content step lets a workspace owner pick how the lead's
DM reply is validated (`validationType`: Mobile/Email/NationalCode/Text/Number/Selectbox),
but there was no option to require the reply to be an image.

## Solution

Added `Image` to `ValidationTypeEnum`, mirroring the Back change. The `<Select>` in
`QuestionContent.tsx` already renders `Object.values(ValidationTypeEnum)`, so the new option
appears automatically once the enum has it — the only wiring needed was a default Persian
error message and the translation label.

## Changes

- `packages/ui/src/automation-builder/types/validationType.enum.ts` — added
  `Image = 'image'`.
- `packages/ui/src/automation-builder/Contents/QuestionContent.tsx` — `getDefaultErrorMessage`
  gained an `Image` case ("لطفا یک تصویر ارسال کنید"), set as `validationErrorMessage` when
  the workspace owner picks Image in the dropdown.
- `apps/dashboard/src/messages/fa.json` — new key
  `Automations.Contents.Question.validationType.items.image` → `"تصویر"`.
- No zod schema change in `automation-builder/schemas/automationForm.ts`
  (`z.nativeEnum(ValidationTypeEnum)` picks up the new value automatically), and `Image`
  doesn't need the `quickReplies`-required rule that `Selectbox` has.

## Review Fixes (2026-08-02, same day)

An independent code review found the dashboard-side implementation correct, but flagged two
gaps before merge, both fixed:

1. **Important, fixed — `apps/admin/src/messages/fa.json` was missing the `image` key.**
   The admin app's template builder (`TemplateForm.tsx`, `mode='template'`) renders the same
   shared `QuestionContent.tsx` as the dashboard — `QUESTION` is not filtered out of template
   mode (only `INSTAGRAM_POST` is excluded there). Admin keeps its own independently-synced
   copy of the `Automations.Contents.Question.validationType.items` translation namespace, so
   an admin picking "Image" on a template's Question step would have seen next-intl's raw-key
   fallback instead of "تصویر". Added the same `"image": "تصویر"` key to admin's `fa.json`.
2. **Important, fixed — `knowledgeMap.doc.md` had no dedicated row for this update doc**,
   breaking the established one-row-per-update-doc convention (it only got an inline
   "Updated 2026-08-02" note on the `automation-builder/` row). Added the standalone row.

## Verification

- No frontend test run and no manual browser verification performed for this change.
- Both `apps/dashboard/src/messages/fa.json` and `apps/admin/src/messages/fa.json` verified
  as valid JSON (`python3 -m json.tool`) after edits.
