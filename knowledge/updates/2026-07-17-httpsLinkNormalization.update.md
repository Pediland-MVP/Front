# 2026-07-17 — https Link Normalization

Full design: `docs/superpowers/specs/2026-07-17-http-to-https-links-design.md`

## Problem

Users entered `http://` links into automation buttons, automation message texts, and product (vitrin) buttons. Nothing enforced https, so customers received insecure links. `REGEX_URL` also accepts bare domains (`shop.ir`), which reached the API with no scheme at all. Admin's template backend already rejects non-https links (`Back/apps/admin/src/templates/dto/templateContent.dto.ts`), so an `http://` link entered in the shared automation form would fail on save.

## Solution

A pure util, `packages/ui/src/lib/toHttps.ts`, wired into the form schemas as zod `.transform()`s. It runs at submit (zodResolver parses on validate and hands `handleSubmit` the transformed data), so it is silent — the input keeps showing what the user typed while the API receives `https://`.

- `httpsUrl(value)` — whole-value URL fields. Upgrades `http://`, passes `https://` through, and prepends `https://` to a bare domain. In `automationForm.ts`, button urls are pre-validated with `REGEX_URL`; in `ProductForm.tsx`, vitrin button urls only require non-empty (`.min(1)`), so bare strings receive `https://` prefix (e.g. `"abc"` → `"https://abc"`).
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
  - **Task 2b expansion**: `.transform(httpsInText)` on `commentStartText`, `commentStartTitle`, `followMessage`, and `reminders[].text` — all confirmed as `<Textarea>` message fields consuming `httpsInText`. This pass did not catch every remaining message textarea — see the Task 5 gap fix below.
  - **Task 5 gap fix** (found in the final whole-branch review, one step after Task 2b): `.transform((v) => (v ? httpsInText(v) : v))` on `validationErrorMessage` in both `ContentItemSchema` and the `reminders[]` item schema. It renders as a `<Textarea>` (`QuestionContent.tsx:134-147`, label "پیام خطای اعتبارسنجی") — the bot sends it back to the customer on failed QUESTION-content validation — but was missed by Task 2b.
  - **Task 6 gap fix** (found in the *second* pass of the final whole-branch review — the third round of gap-closing overall, after Task 2b and the Task 5 fix above): `.transform(httpsInText)` on `VitrinItemSchema.description`. It renders as a `<Textarea>` (`VitrinContent.tsx:212-224`, `rows={2}`) — the per-card message text the bot sends to the customer alongside the vitrin card — but had no transform wired. It is distinct from the dashboard's own product-catalog "description" field (`apps/dashboard/src/components/Products/ProductForm.tsx`), which stays out of scope by design. `VitrinItemSchema.title` was checked in the same pass and correctly stays untouched — it is a plain `<Input>` (`VitrinContent.tsx:196-208`), matching the existing convention (Input fields left alone, Textarea fields covered).
- **Modify** `Front/apps/dashboard/src/components/Products/ProductForm.tsx` — `.transform(httpsUrl)` on the `ButtonTypeEnum.URL` branch of the button field schema.

## Notes

- `ButtonSchema` is shared by `buttonTemplate.buttons`, `quickReplies`, and `VitrinItemSchema.buttons`, so one transform covers every automation button URL.
- `optionalStringToUndef` also backs `consentText`. The transform is chained onto `text` only — `consentText` is intentionally not normalized.
- `followCheckMessage` was deliberately **not** wired, despite living right next to `followMessage`. It renders as a plain `<Input>` (a short "retry button" label, e.g. "فالو کردم ✅"), not a message. This was caught during code review and left untouched by decision.
- `title` (the automation's own name) was also deliberately left untouched — it is a plain `<Input>`, not a message.
- Coverage note: this feature went through **three rounds of gap-closing** after the initial Task 2/2b pass — `validationErrorMessage` (Task 5) and `VitrinItemSchema.description` (Task 6) were both found by later review passes, not the original sweep. Treat any prior "coverage is exhaustive" framing in this doc's earlier sections as describing the state *at that point in time*, not a final guarantee — always re-check Textarea message fields against the transform list when touching this schema.
- **`commentTexts`** (the bot's public comment auto-reply strings, `apps/dashboard/src/components/Automations/Form/CommentReplies.tsx`) was reviewed and deliberately **excluded**, closing the coverage question rather than leaving it open. It is architecturally in the same category as `followCheckMessage`/`title`/button titles: a plain `<Input>` (not a `<Textarea>`), and its defaults are short acknowledgement phrases ("به دایرکت شما ارسال شد ✅"). The scope this feature targets is "URL fields + message textareas" — `commentTexts` is neither. Covering it would mean widening the rule from "Textarea = message, Input = label" to "any customer-facing text," which is a different, larger feature. If a future incident shows customers actually pasting `http://` links into comment auto-replies, that's the trigger to revisit this — not a reason to silently expand scope now.
- `automationForm.ts` is shared with the admin templates form, so admin inherits this normalization. Intended: it matches admin's https-only backend validation.
- `apps/dashboard/src/schemas/aas.ts` contains a near-identical dead schema that nothing imports. Left untouched; worth deleting in a separate cleanup.

## Verification

- `cd Front/packages/ui && pnpm vitest run src/lib/__tests__/toHttps.test.ts` — 16 pass (all util variants).
- `cd Front/packages/ui && pnpm vitest run src/automation-builder/__tests__/schema.test.ts` — 16 pass (9 from Task 2 + 4 from Task 2b's additional fields + 2 from the Task 5 `validationErrorMessage` gap fix + 1 from the Task 6 `VitrinItemSchema.description` gap fix).
- `cd Front/packages/ui && pnpm vitest run src/automation-builder/__tests__/AutomationBuilder.test.tsx src/automation-builder/Contents/__tests__/Contents.test.tsx` — 19 pass (regression check for Task 6, unrelated pre-existing `DialogContent` a11y console warnings).
- `ProductForm` wiring has no automated test (its schema is inline and closes over `t`); verified by tracing the submit path, including into `@hookform/resolvers/zod`'s source, to confirm `handleSubmit` receives the transformed zod output.
