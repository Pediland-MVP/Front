# 2026-07-17 — `#نام` variable hint added to button-template text field

Reference code: `packages/ui/src/automation-builder/Contents/ButtonContent.tsx`.

## Problem

The `#نام` template variable (replaced server-side with the lead's name) already worked
for plain text/question content, and the text/question fields show a "you can use #نام"
hint as their label. The button-template's body/caption field showed a plain
"ارسال دکمه متنی" label with no hint, even though the backend now also resolves `#نام`
there (see `Back/knowledge/updates/2026-07-17-buttonTemplateNameVar.update.md`).

## Solution

- `ButtonContent.tsx`: the `buttonTemplate.text` field's `FormLabel` now renders
  `t.rich('you_can_use_vars', { name: ... })` — same pattern as
  `TextContent.tsx`/`QuestionContent.tsx` — instead of the plain `t('text.label')`
  string.
- Scope: only the button-template body/caption field. Individual button title inputs
  (`ContentButtonsItem.tsx`) are unchanged — `#نام` is not supported there.
- Added `Automations.Contents.Button.you_can_use_vars` translation key to
  `apps/dashboard/src/messages/fa.json`, `en.json`, and `apps/admin/src/messages/fa.json`
  (same value as the existing `Text`/`Question` sections). Admin's `en.json` has no
  `Button` section, so nothing to add there.

## Verification

- JSON validity checked on all three edited translation files.
- No existing test coverage for `ButtonContent.tsx`; visual/manual check recommended
  before merge.
