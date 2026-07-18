# 2026-07-18 — Vitrin (generic template) title/description made optional

Reference code: `packages/ui/src/automation-builder/schemas/automationForm.ts`,
`packages/ui/src/automation-builder/Contents/VitrinContent.tsx`.

## Problem

`VitrinItemSchema.title`/`description` were `.nonempty()`, blocking submission of a
vitrin item without both fields filled in. Backend relaxed the same constraint on
`CreateVitrinDto`/`TemplateVitrinDto` (see `Back/knowledge/updates/2026-07-18-vitrinOptionalTitleDescription.update.md`),
so the frontend schema needed to match.

## Solution

- `VitrinItemSchema.title`: `z.string().nonempty()` → `z.string().optional().nullable()`.
- `VitrinItemSchema.description`: dropped `.nonempty()`, kept the `httpsInText`
  transform but guarded it for empty/undefined values.
- No other UI changes were needed — `VitrinContent.tsx`'s title/description fields
  have no separate required indicator (no label, no `required` attribute, no manual
  validation); error display is driven entirely by the zod schema.
- Updated the placeholders (`Automations.Contents.Vitrin.fields.title/description`
  in `fa.json`) to read "عنوان (اختیاری)" / "توضیحات (اختیاری)" so the optionality is
  visible to the user, and grew the description `Textarea` from 2 to 5 rows.

## Changes

- `packages/ui/src/automation-builder/schemas/automationForm.ts` — `VitrinItemSchema`.
- `packages/ui/src/automation-builder/Contents/VitrinContent.tsx` — description
  `Textarea` `rows={2}` → `rows={5}`.
- `apps/dashboard/src/messages/fa.json` — `Automations.Contents.Vitrin.fields.title/description.placeholder`.

## Verification

- No dedicated test suite covers `VitrinItemSchema` required-field behavior; change
  reviewed by inspection against the matching backend DTO relaxation.
