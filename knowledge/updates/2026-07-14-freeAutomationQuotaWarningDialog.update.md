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

## Fix (2026-07-18): dialog re-showed on every submission past the boundary

`fix/free-quota-dialog-repeat` — `getFreeQuotaWarning` originally gated on `automationCount >= freeAutomationLimit` plus `!freeAutomationQuotaExceeded`. Confirmed against the local dev DB that a page's live `automationCount` can get ahead of the backend's sticky `freeAutomationQuotaExceeded` flag (any `ContentCycleInstagram` row created outside `ContentCycleService.save()`/`update()` — e.g. the seeded dev-DB fixtures had `automationLinkCount=0` while their live count already sat at the limit, see `packages/entities/src/_seeder/seed.entities.ts`). While the flag lags, `>=` keeps matching on every subsequent submission instead of just the one that crosses the boundary.

Changed the comparison to exact equality (`automationCount === freeAutomationLimit`): the dialog now only fires on the single submission that takes a page from `limit` to `limit + 1`, and stops matching on its own once the live count moves past that value — regardless of whether the sticky flag ever catches up. No backend change needed.

## Verification

Not yet run for the 2026-07-14 feature itself. The 2026-07-18 fix added `AutomationForm.freeQuota.test.tsx` (3 cases: dialog shows exactly at the boundary; does not re-show once the live count is already past the limit but unflagged; does not show once the sticky flag is set) — not run this session either, per the user's explicit instruction that tests only run with permission each time; the user opted to test manually instead. **Pending**: run `AutomationForm.freeQuota.test.tsx` and a manual browser check of the actual dialog flow.
