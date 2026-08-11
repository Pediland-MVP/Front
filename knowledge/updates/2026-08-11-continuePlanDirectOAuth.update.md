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
