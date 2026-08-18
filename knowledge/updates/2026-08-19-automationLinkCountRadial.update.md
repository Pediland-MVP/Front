# 2026-08-19 — dashboard header radial + ad-alert: automation quota fixes

Branch: committed directly to `main` (user-directed, no worktree). Paired Back doc:
`Back/knowledge/updates/2026-08-19-automationLinkCountExposed.update.md`.

## Problem 1 — the ad-warning banner condition

`SubscriptionBoard.tsx`'s "اشتراک شما تمام شده..." alert (ads are being sent) used to show
whenever the user had no subscription at all (`!hasSubscription`), regardless of whether the page
actually had ads enabled. It should only show when the page (1) has no free automation slot left
and (2) currently has ads enabled.

## Problem 2 — the radial had no visual "exceeded" state

The "X of Y free automations used" radial (`ProgressRadial.tsx`, `type="automation"`) always used
the same violet→blue gradient ring regardless of whether the count was at/over the free limit.

## Problem 3 — the radial's count used the wrong source

The radial's numerator (`totalAutomationCount` in `SubscriptionBoard.tsx`) summed the *live*
`automationCount` (goes back down when an automation is deleted). This is inconsistent with the
sticky ad-alert, which never resets — a page could show "1 of 2" (room left) right next to an
alert saying ads are already running.

## Fix

- `SubscriptionBoard.tsx`: added `reservedSubscription` lookup and
  `hasPromotedAccount = accounts?.some(acc => acc.freeAutomationQuotaExceeded && acc.isPromotion)`,
  used only for the ad-alert banner (the radial's free-trial-vs-subscription branch still uses
  `hasSubscription = active || reserved`, unrelated to this).
- `ProgressRadial.tsx`: added `isAutomationOverLimit = type === 'automation' && actualPercentage >= 100`,
  computed live from the existing `percentage`/`total` props (not a new prop) — the ring's stroke
  switches from the gradient to solid `#dc2626` when the count is at or over the limit. 5 new
  vitest cases (under/at/over limit, reverting on rerender, non-automation types unaffected) —
  `ProgressRadial.test.tsx`, 8/8 pass.
- `SubscriptionBoard.tsx#totalAutomationCount`: switched from summing `automationCount` (live) to
  `automationLinkCount` (monotonic, never decreases — see the paired Back doc, which had to
  explicitly expose this field first). The counter text itself was already unclamped
  (`{percentage} از {total}`), so a page that's used 3 automations against a limit of 2 correctly
  shows "3 از 2" with the red ring, not clamped to "2 از 2".
- `types/instagram.ts`: added `automationLinkCount: number` to `InstagramNamespace.Account`.

## Verification

- `apps/dashboard` (pnpm filter `front`) `tsc --noEmit`: no new errors anywhere (checked
  specifically for the touched files and for any `Account`-shaped object-literal errors from the
  new required field — none).
- `ProgressRadial.test.tsx`: 8/8 pass (3 pre-existing + 5 new).
- Verified live against the local dev server + dev DB: a no-subscription test workspace
  (`My Workspace` / `Flossie19`, `automationLinkCount = 3`, `automationCount = 1`,
  `freeAutomationLimit = 2`) correctly shows the ad-alert, and the radial shows "۳ از ۲" with a red
  ring — confirmed via screenshot.
