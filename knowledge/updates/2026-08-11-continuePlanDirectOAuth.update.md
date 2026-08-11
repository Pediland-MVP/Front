# Setup Dialog — "Continue With Plan" Goes Straight to OAuth (2026-08-11)

Related: `2026-08-09-setupDialogUnboundStep.update.md` (introduced the unbound
step; at that point its continue button already linked straight to OAuth),
`2026-08-09-connectUnboundPlanChoice.update.md`.

## Problem

At some point after `2026-08-09-setupDialogUnboundStep.update.md`, the
"ادامه با همین اشتراک" (continue with this plan) button in
`SetupInstagramDialog`'s unbound-plan step was changed to link to
`/connect?continueWithPlan=1` instead of straight into the Instagram OAuth
handshake. That query flag told `/connect`'s gate the unbound-plan question was
already answered, so the page would show the plain "اتصال اکانت" button
instead of reopening the dialog — but the user still had to click that second
button to actually start OAuth. Reported by the user as an extra, unnecessary
hop: the button should behave exactly like the plain "اتصال اکانت" button
(`IG_OAUTH_URL`), not land on an intermediate page.

## Solution

Point the dialog's continue button straight at `IG_OAUTH_URL` — the same
constant the plain connect button on `/connect` uses — instead of routing
through `/connect`. Since that route was the only reason the
`continueWithPlan` query flag existed, removed the now-dead machinery instead
of leaving it unused:

- `CONTINUE_WITH_PLAN_PARAM` / `CONTINUE_WITH_PLAN_HREF` (were exported from
  `useAddInstagramGate.ts`).
- The `unboundPlanAccepted` option on `useAddInstagramGate` and the
  corresponding `searchParams` read in `connect/page.tsx`.

`requiresSetupDialog` in `useAddInstagramGate` simplifies to
`needsSubscriptionSetup || hasUnboundPlan` — there is no longer an "already
answered" state to clear, since the dialog itself now fully owns the decision
and never hands it off to the page.

## Changes

- `apps/dashboard/src/components/Connect/SetupInstagramDialog.tsx` — continue
  button's `href` changed from `CONTINUE_WITH_PLAN_HREF` to `IG_OAUTH_URL`
  (imported from `@/utils/instagramOAuthUrl`, already shared with `/connect`).
- `apps/dashboard/src/hooks/useAddInstagramGate.ts` — removed
  `CONTINUE_WITH_PLAN_PARAM`, `CONTINUE_WITH_PLAN_HREF`, and the
  `unboundPlanAccepted` option; `requiresSetupDialog` now derives from
  `hasUnboundPlan` directly.
- `apps/dashboard/src/app/(Connect)/connect/page.tsx` — dropped the
  `continueWithPlan` query read and the option passed into
  `useAddInstagramGate`.
- Tests: `SetupInstagramDialog.test.tsx` — the two tests covering the
  continue-button href/close behavior now assert `IG_OAUTH_URL`.
  `connect/page.test.tsx` — removed the
  `ConnectPage — arriving with the unbound plan already accepted` describe
  block (its scenario no longer exists).

## Verification

`vitest run SetupInstagramDialog.test.tsx "connect/page.test.tsx"` —
**28 passed** (20 dialog + 8 connect page).

Not smoke-tested in a browser.

## Addendum (same day): merged in `fix/instagram-wizard-ui-polish`

Per explicit user request, consolidated a second, unrelated in-flight fix for
the same dialog into this branch instead of leaving it in its own worktree.
That work (`Front/worktrees/instagram-wizard-ui-polish`) existed only as
**uncommitted** changes — committed here as `e4d96ba7` before merging
(`--no-ff`, merge commit `bbf7f58e`) so the history is preserved. Clean
auto-merge, no conflicts, despite both branches editing the same import block
in `SetupInstagramDialog.tsx`.

Three bundled fixes, none related to the OAuth-redirect change above:

1. **Dialog layout shift** (the user-reported issue this addendum is really
   about): `SetupInstagramDialog`'s content area now has a bounded
   `h-[min(760px,88vh)]` height with an internal `overflow-y-auto` region per
   step (plus scroll-shadow hints on scrollable content), so step content —
   mainly step 2's duration cards — no longer resizes the dialog itself as it
   loads or changes. Previously the dialog grew/shrank with its content.
2. **Wizard-resume params dropped on redirect**: `AuthProvider`'s auth-guard
   redirect (fires when an authenticated user without instagram access hits a
   page) was doing a bare `redirect = connectFlowPendingDest ?? '/connect'`,
   silently losing the `igw*` params `SetupInstagramDialog` stamps onto the
   URL before a create-workspace-and-switch reload — exactly the moment a
   brand-new workspace (zero Instagram accounts) lands here. Fixed by
   forwarding `useInstagramWizardResume`'s now-exported `RESUME_PARAM_KEYS`
   onto the redirect target.
3. **Removed `pendingInstagramConnect.ts`**: the one-time-read
   `pending_ig_username` cookie and its "@username پیام یادآوری" reminder text
   on `/connect`, superseded by the resume-state mechanism in (2). Deleted the
   util, its usage in `connect/page.tsx`, and the `pending_username_reminder`
   i18n key.

### Changes (addendum)

- `apps/dashboard/src/components/Connect/SetupInstagramDialog.tsx` — bounded
  height, per-step internal scroll (`scrollAreaRef`, `scrollShadow` state
  recomputed on step/content changes).
- `apps/dashboard/src/components/Providers/AuthProvider.tsx` — forwards
  `RESUME_PARAM_KEYS` onto the redirect target.
- `apps/dashboard/src/components/Connect/useInstagramWizardResume.ts` —
  `RESUME_PARAM_KEYS` exported (was module-private).
- `apps/dashboard/src/utils/pendingInstagramConnect.ts` — deleted.
- `apps/dashboard/src/app/(Connect)/connect/page.tsx` — dropped the
  `pendingUsername` state/effect and its reminder `<p>`.
- `apps/dashboard/src/messages/fa.json` — removed `pending_username_reminder`,
  added `apify_error_warning` (manual-plan fallback step copy).

### Verification (addendum)

`vitest run SetupInstagramDialog.test.tsx "connect/page.test.tsx" AuthProvider.test.tsx`
— **33 passed** (20 dialog + 7 connect page + 6 AuthProvider).

Not smoke-tested in a browser.
