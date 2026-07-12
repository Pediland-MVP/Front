# Per-Workspace Automation Default Texts (2026-07-12)

Full design: `docs/superpowers/specs/2026-07-12-default-automation-texts-design.md`.
Backend side: `Back/knowledge/updates/2026-07-12-defaultAutomationTexts.update.md`.

## Problem

Every new automation's follower-guard, comment-start, and comment-reply text fields prefilled
from the same hardcoded text for every workspace (i18n keys / literals), regardless of what a
workspace had customized them to on previous automations.

## Solution

New `useAutomationDefaults()` hook fetches `GET /contentCycle/automation-defaults`
(workspace-scoped, `null` per field if never saved). `AutomationForm.tsx` (create mode only),
`JustFollowers.tsx`, and `CommentReplies.tsx` now prefer these fetched values over the original
i18n/hardcoded defaults — falling back to them unchanged when a field is `null`. The edit form
is unaffected: its own saved values already populate the form.

## Changes

- `apps/dashboard/src/types/responseMessage.ts` — added `AUTOMATION_DEFAULTS_FETCHED` to
  `RES_CODES`.
- `apps/dashboard/src/hooks/useAutomationDefaults.ts` — new hook.
- `apps/dashboard/src/components/Automations/Form/JustFollowers.tsx` — prefers workspace
  default over `t(...)` on toggle-on.
- `apps/dashboard/src/components/Automations/Form/CommentReplies.tsx` — prefers workspace
  default array over the hardcoded Persian literals on toggle-on.
- `apps/dashboard/src/components/Automations/AutomationForm.tsx` — applies workspace defaults
  to untouched fields once fetched (create mode only), and uses them in the pre-submit
  fallback chain.

## Verification

- `npx tsc --noEmit` — no new errors.
- Manual end-to-end: saved an automation with distinctive follower-guard/comment-start/
  comment-reply text, confirmed a subsequent new automation prefilled with those exact values,
  confirmed editing an existing automation is unaffected. See
  `Back/knowledge/updates/2026-07-12-defaultAutomationTexts.update.md` for the backend-side
  verification.
