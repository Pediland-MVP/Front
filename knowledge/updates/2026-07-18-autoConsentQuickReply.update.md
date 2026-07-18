# 2026-07-18 — Auto-add "مکث و ادامه" (CONSENT) quick reply on non-last TEXT contents

Reference doc: `docs/superpowers/specs/2026-07-18-auto-consent-quickreply-design.md`
Reference code: `packages/ui/src/automation-builder/Contents/Contents.tsx`
(shared by the dashboard `AutomationForm` and the admin templates builder — see
`automation-builder/` entry in `knowledgeMap.doc.md`).

## Problem

Instagram's own send UI hides a TEXT content's quick-reply buttons the moment
another content follows it in the automation — unless one of those quick
replies is the `CONSENT` type (labelled **"مکث و ادامه"**, pause-and-continue).
`CONSENT` already existed and already worked at send time
(`Back/apps/core/src/contentCycle/contentCycle.service.ts`,
`shouldPauseForConsent`), but nothing added it automatically: a user had to
know about the Instagram quirk and manually pick `CONSENT` from the
quick-reply's type dropdown every time. Forgetting it silently broke the
buttons in production.

## Solution

`Contents.tsx` already watches the whole `contents` array (`useWatch({ name:
'contents', control })`) for every add/delete/drag-reorder. A new `useEffect`
scans that array (mode `AUTOMATION` only — `reminders` is out of scope, see the
design doc) and, for every content except the last one, inserts a `CONSENT`
quick reply at **index 0** when:

- `type === TEXT`
- it already has at least one quick reply
- none of its quick replies is already `CONSENT`
- it has fewer than 13 quick replies (the DTO/UI cap)

The presence check (`!quickReplies.some(qr => qr.postbackPayloadType ===
CONSENT)`) is what prevents duplicate inserts — it doesn't distinguish
"user added this" from "this effect added it earlier"; either way, once a
`CONSENT` button exists, nothing runs again for that content. Because the
check is stateless, if a user manually deletes an auto-added button and later
makes another array-level edit, it can come back — this was a deliberate
choice (no new provenance flag on quick replies), confirmed in the design doc.
This effect never removes a `CONSENT` button, including when a content that
had one added stops being last again.

The button's title originally reused the translation key `Button.CONSENT.label`
(`"مکث و ادامه"`) — corrected same-day in
`2026-07-18-lockConsentQuickReply.update.md` to a dedicated
`Button.CONSENT.auto_title` (`"ادامه"`), since `"مکث و ادامه"` reads well as
the internal type-picker name but not as the actual button text an Instagram
customer taps.

No backend change: the payload this produces is the same shape a
manually-added `CONSENT` quick reply already produces, and `CreateQuickReplyDto`
already accepts it.

## Changes

- `packages/ui/src/automation-builder/Contents/Contents.tsx` — added `setValue`
  to the `useFormContext()` destructure, added `t_button =
  useTranslations('Automations.Contents.Button')`, and the new detection/insert
  `useEffect` described above.

## Verification

- New tests in `packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx`
  (describe block "Contents — auto CONSENT quick reply on non-last TEXT
  contents", 7 cases): inserts at index 0 for a qualifying content; no
  duplicate when `CONSENT` already present; no insert at the 13-item cap; no
  insert with zero quick replies; no insert for non-TEXT content types
  (e.g. `QUESTION`, which already unconditionally pauses); no insert for the
  last content in the list; an existing `CONSENT` button is left in place when
  the content is last (no auto-removal).
- Also fixed a latent gap in this test file's `next-intl` mock: it didn't stub
  `t.rich`, used by `TextContent`/`QuestionContent` for a "you can use
  variables" hint. Earlier tests in the file never fully rendered those content
  bodies, so this only surfaced once the new tests rendered real TEXT/QUESTION
  items.
- `pnpm vitest run src/automation-builder/Contents/__tests__/Contents.test.tsx`
  (from `packages/ui`) — 20/20 pass (13 pre-existing + 7 new).
- Not yet manually verified in a browser; only scoped-file vitest coverage
  above.
