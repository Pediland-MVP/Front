# Free Automation Quota Warning Dialog (2026-07-14)

Adds a confirmation dialog on the automation-create form that warns the user right before the automation that would push a selected Instagram page over its free automation quota (2 free automations per page by default, admin-configurable — see `Back/knowledge/core/contentCycle/contentCycle.doc.md` "Free Automation Quota").

## Problem

The backend's free-automation-quota feature (`Back` branch `feat/free-automation-quota`, not yet merged) silently flips a page into promotion mode (Befroosh ad shown in the DM footer) once its automation count crosses the free limit — with no warning to the user beforehand.

## Solution

- `types/instagram.ts`: `InstagramNamespace.Account` gains `automationCount` (live count), `freeAutomationLimit`, and `freeAutomationQuotaExceeded` — all already returned by the backend's `GET /instagram/accounts` (as of the paired Back branch), just not previously typed on the frontend.
- New `components/Automations/FreeQuotaWarningDialog.tsx` — an `AlertDialog` (same pattern as `Global/DeleteConfirmationDialog.tsx`) showing the warning text plus a linear `Progress` bar with a "{used} of {limit}" label.
- `components/Automations/AutomationForm.tsx`:
  - Fetches `/instagram/accounts` via the same SWR key `InstagramSelectField` already uses (deduped, no extra request).
  - `onSubmit` (only for a brand-new automation, `!id`): before submitting, checks each selected `instagramId` against the account data. If a page hasn't yet crossed its quota (`!freeAutomationQuotaExceeded`) but its live `automationCount >= freeAutomationLimit`, the submit is paused, the dialog opens, and the form values are held in `pendingSubmitValues`.
  - The submission logic itself was extracted into a `submitAutomation(values)` function so both the normal (no-warning) path and the dialog's "confirm" button call the same code.
  - Gated on `freeAutomationQuotaExceeded`, deliberately **not** `isPromotion` — a page can be over its free quota but still not promoted if it has active subscription coverage; the warning is specifically about the free-quota boundary, not the subscription state. See `Back/knowledge/core/instagrams/instagrams.doc.md`'s `GET /instagram/accounts` entry.
  - Once already `freeAutomationQuotaExceeded === true`, no dialog shows on further automations for that page (adding more doesn't change anything — matches the design's one-way-sticky semantics).
- `messages/fa.json` / `messages/en.json`: new `Automations.FreeQuotaWarningDialog` namespace (title/description/usageLabel/buttons), following the existing `ContentPromotionDialog` namespace's shape.

## Known simplification

The dialog's trigger condition is a live-count comparison done client-side; it does not re-derive `freeAutomationQuotaExceeded` from scratch, only reads what the backend already computed. This is intentionally simple — no new backend endpoint, no new computation duplicated on the frontend.

## Verification

Not yet run — per the user's explicit instruction this session, no `tsc`/`next build`/broad `jest` run has been executed without asking first. Manual read-through of the diff (imports, prop shapes, JSX structure, translation key paths) was done in place of compiling. **Pending**: `npx tsc --noEmit` in `apps/dashboard` and a manual browser check of the actual dialog flow, both to be run only with explicit permission.
