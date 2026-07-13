# Automation copy: duplicate an existing automation into a new one — 2026-07-13

Full design: `docs/superpowers/specs/2026-07-13-automation-copy-design.md` (outer repo).
Full implementation plan: `docs/superpowers/plans/2026-07-13-automation-copy.md` (outer repo).

## Problem

Users who already built an automation had no way to start a new one pre-filled
from an existing one — every automation had to be rebuilt from scratch on
`/automations/add`.

## Solution

Added a "کپی" (Copy) button to each automation card, next to Edit. It navigates
to `/automations/add?copyFrom=<uuid>`, which pre-fills the create form
(conditions, triggers, contents, connected Instagram accounts) from the source
automation, reusing the exact fetch+prefill logic already used for editing.
Saving always creates a new, independent automation (`POST /contentCycle`) —
the source is never modified, and the button label/breadcrumb correctly read
"create" (not "edit") throughout.

A real backend bug was found and fixed during manual verification: copying an
automation with image/file content initially failed, because
`content_cycle_content.fileId` has a strict unique constraint (one file row
per content row, forever). Fixed on the Back side by duplicating the file (S3
`CopyObject` + new `file` row) whenever the create path finds a file already
attached elsewhere — see the Back-repo update doc for details. No frontend
change was needed for that fix.

## Changes

- `AutomationCard.tsx` — new "Copy" button (gated by `automation:create`),
  navigates to `/automations/add?copyFrom=<id>`.
- `automations/add/page.tsx` — now async, reads and validates the `copyFrom`
  search param, passes it to `AutomationForm` as `copyFromId`.
- `AutomationForm.tsx` — new optional `copyFromId` prop; the SWR fetch key
  that drives the prefill effect is now `id ?? copyFromId`, while `id` itself
  (which decides `PATCH` vs `POST` on submit) is untouched. Fires a toast once
  prefill completes in copy mode.
- `fa.json` — new `Automations.Card.copy` and `Automations.Toast.copied` keys.

## Verification

Manually exercised end-to-end in the running dashboard dev server, including
the file-duplication fix: copy button appears on cards, navigates with the
correct query param, form pre-fills with all content and Instagram links,
toast fires once, saving an automation with two image contents returns `201`
and creates a fully independent new automation (verified at the DB level —
the copy's `content_cycle_content` rows got brand-new `fileId`s and distinct
S3 object keys, both objects independently resolve `200`, original untouched).
Invalid/missing `copyFrom` falls back to a plain empty create form with no
error.
