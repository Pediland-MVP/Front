# 2026-07-17 — https Link Normalization

Full design: `docs/superpowers/specs/2026-07-17-http-to-https-links-design.md`

## Problem

Users entered `http://` links into automation buttons, automation message texts, and product (vitrin) buttons. Nothing enforced https, so customers received insecure links. `REGEX_URL` also accepts bare domains (`shop.ir`), which reached the API with no scheme at all. Admin's template backend already rejects non-https links (`Back/apps/admin/src/templates/dto/templateContent.dto.ts`), so an `http://` link entered in the shared automation form would fail on save.

## Solution

A pure util, `packages/ui/src/lib/toHttps.ts`, wired into the form schemas as zod `.transform()`s. It runs at submit (zodResolver parses on validate and hands `handleSubmit` the transformed data), so it is silent — the input keeps showing what the user typed while the API receives `https://`.

- `httpsUrl(value)` — whole-value URL fields. Upgrades `http://`, passes `https://` through, and prepends `https://` to a bare domain. Safe because callers validate with `REGEX_URL` first.
- `httpsInText(text)` — free text. Upgrades explicit `http://` only. It deliberately does **not** prepend a scheme to bare domains: nothing validates free text, so that rule would wrongly rewrite `index.js`, `فایل.zip`, or `1.5`.

No exception for localhost or raw IPs, by decision.

## Changes

- **Create** `Front/packages/ui/src/lib/toHttps.ts` — the util module with `httpsUrl` and `httpsInText` functions.
- **Create** `Front/packages/ui/src/lib/__tests__/toHttps.test.ts` — 16 unit tests covering both util functions.
- **Modify** `Front/packages/ui/package.json` — added the `"./lib/toHttps"` export path.
- **Modify** `Front/packages/ui/src/automation-builder/schemas/automationForm.ts`:
  - `.transform(httpsUrl)` on `ButtonSchema`'s `url` field (covers button templates, quick replies, and vitrin buttons).
  - `.transform(httpsInText)` on `ButtonTemplateSchema.text` (button template messages).
  - `.transform(httpsInText)` on `ContentItemSchema.text` (content item text body).
  - **Task 2b expansion**: `.transform(httpsInText)` on `commentStartText`, `commentStartTitle`, `followMessage`, and `reminders[].text` — all confirmed as `<Textarea>` message fields consuming `httpsInText`.
- **Modify** `Front/apps/dashboard/src/components/Products/ProductForm.tsx` — `.transform(httpsUrl)` on the `ButtonTypeEnum.URL` branch of the button field schema.

## Notes

- `ButtonSchema` is shared by `buttonTemplate.buttons`, `quickReplies`, and `VitrinItemSchema.buttons`, so one transform covers every automation button URL.
- `optionalStringToUndef` also backs `consentText`. The transform is chained onto `text` only — `consentText` is intentionally not normalized.
- `followCheckMessage` was deliberately **not** wired, despite living right next to `followMessage`. It renders as a plain `<Input>` (a short "retry button" label, e.g. "فالو کردم ✅"), not a message. This was caught during code review and left untouched by decision.
- `title` (the automation's own name) was also deliberately left untouched — it is a plain `<Input>`, not a message.
- `automationForm.ts` is shared with the admin templates form, so admin inherits this normalization. Intended: it matches admin's https-only backend validation.
- `apps/dashboard/src/schemas/aas.ts` contains a near-identical dead schema that nothing imports. Left untouched; worth deleting in a separate cleanup.

## Verification

- `cd Front/packages/ui && pnpm vitest run src/lib/__tests__/toHttps.test.ts` — 16 pass (all util variants).
- `cd Front/packages/ui && pnpm vitest run src/automation-builder/__tests__/schema.test.ts` — 13 pass (9 from Task 2 + 4 from Task 2b's additional fields).
- `ProductForm` wiring has no automated test (its schema is inline and closes over `t`); verified by tracing the submit path, including into `@hookform/resolvers/zod`'s source, to confirm `handleSubmit` receives the transformed zod output.
