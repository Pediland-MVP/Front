# Comment Start Guard — Align Submit Validation With Self-Gating content[0] (2026-08-15)

Linear: [BEF-162](https://linear.app/befrooshapp/issue/BEF-162/pyam-drkhwast-shrwa) (follow-up fix).
Branch: `fix/comment-start-selfgates` (Front only — no Back change needed).
Follows: `2026-08-01-smartConsentDisable.update.md`, which introduced the
`firstContentSelfGates` behavior this fix finishes propagating.

## Problem

Creating a comment-triggered automation whose **first content is a QUESTION** (with at
least one more content after it) was impossible — the form refused to submit with
`در حالت کامنت، پیام درخواست شروع ضروری است` ("in comment mode, the start-request message
is required"), pointing at a field that was not on screen. The user had no way to satisfy
it.

Two places decided "does this automation need `commentStartText`?", and they had drifted:

- `StartAutomationMessage.tsx` (the field itself) was updated by BEF-162 on 2026-08-01 to
  skip the start-request card when `content[0]` already self-gates — a `QUESTION`, or a
  `TEXT` carrying quick replies. When it skips, it also **clears `commentStartText` to
  `''`**.
- `AutomationForm.tsx`'s `handleBeforeSubmit` guard was **not** updated. It kept the old
  inline condition (`isComment && (content[0] is PRODUCT || contents.length > 1) &&
  !justFollowers && !commentStartText`).

So for a self-gating `content[0]` the field hid itself and blanked the value, while the
guard still rejected the blank value — a deadlock. `setError`/`setFocus` targeted an
unrendered field, so only the toast was visible.

The backend was correct and was never the problem. `handleComment`
(`Back/apps/core/src/contentCycle/contentCycleMessage.service.ts`) computes its own
`firstContentSelfGates` and sends the start-request private reply **only** when neither
`isSingleMessage` nor `firstContentSelfGates` holds. For a QUESTION-first automation it
never reads `commentStartText` at all — confirming the frontend was demanding a value the
backend would never use.

## Second defect, fixed in the same pass — `justFollowers` was a blanket exemption

The old guard skipped the `commentStartText` requirement entirely whenever
`justFollowers` was true, and `StartAutomationMessage` hid the card (clearing the value to
`''`) for the same reason. That is too broad.

`followerGuard` (`Back/apps/core/src/contentCycle/follower.service.ts`) returns
`countinue: true` for a **comment** only when:

```
leadInstagram && userProfile.isUserFollowBusiness && contents.length === 1 && !reminderTime
```

Every other shape returns `countinue: false`, and `handleComment` then early-returns right
after the reply comment — so most `justFollowers` automations genuinely never reach the
start message. But one shape does get through **and still sends it**: a **single PRODUCT
content with no reminder** (a lone PRODUCT keeps `isSingleMessage` false, because products
need the lead authenticated). For that automation the backend sent
`contentCycle.commentStartText` while the frontend had guaranteed it was empty.

`justFollowers` is therefore treated as a *narrowing* of which shapes reach the message,
not an exemption from it.

> Note: `contents.length > 1` with `justFollowers` was initially suspected as the broken
> case. It is not — `followerGuard` stops those comments before the start message. The
> single-PRODUCT shape is the only reachable one.

## Solution

Extracted the decision into one shared predicate and had both call sites read it, so they
cannot drift again:

`packages/ui/src/automation-builder/utils/commentStart.ts`

- `firstContentSelfGates(contents)` — `content[0]` is a `QUESTION`, or a `TEXT` with
  quick replies. Mirrors the backend's own check. (The `quickReplies.length > 0` form,
  rather than looking specifically for the CONSENT quick reply, is kept deliberately —
  see the reasoning in `2026-08-01-smartConsentDisable.update.md`.)
- `isCommentStartMessageRequired({ isComment, justFollowers, contents, reminderTime })` —
  the single source of truth for whether the start-request message is actually sent, and
  therefore whether `commentStartText` is required. Its `justFollowers` branch encodes
  `followerGuard`'s continue condition (single PRODUCT content, no reminder).

## Changes

- `packages/ui/src/automation-builder/utils/commentStart.ts` — **new**; both helpers.
- `packages/ui/src/automation-builder/index.ts` — exports the new util.
- `packages/ui/src/automation-builder/Contents/StartAutomationMessage.tsx` — its
  activation effect now calls `isCommentStartMessageRequired` instead of recomputing the
  condition inline, and additionally watches `reminderTime` (the `justFollowers` branch
  depends on it, so the card must react to a reminder being set like any other input).
  The only behavior change: the card now **shows** for a `justFollowers` automation with a
  single PRODUCT content and no reminder, where it used to be hidden.
- `apps/dashboard/src/components/Automations/AutomationForm.tsx` — `handleBeforeSubmit`'s
  guard is now `isCommentStartMessageRequired(values) && !values.commentStartText`. The
  now-unused `firstType` local was removed.
- `packages/ui/src/automation-builder/utils/__tests__/commentStart.test.ts` — **new**; 15
  tests encoding the backend's truth table branch by branch, including a `justFollowers`
  block covering all five of its shapes.
- `apps/dashboard/src/components/Automations/AutomationForm.commentStart.test.tsx` —
  **new**; end-to-end regression test that renders the real form with a QUESTION-first
  comment automation and asserts the submit reaches `POST /contentCycle` and the
  start-request toast never fires. This test fails on the pre-fix code.

## Verification

- `packages/ui`: `vitest run src/automation-builder/` → **132 passed** (13 files),
  including the existing BEF-162 tests that assert the card hides for QUESTION-first.
- The `justFollowers` single-PRODUCT test was also watched red before its fix.
- `apps/dashboard`: `vitest run src/components/Automations/` → **34 passed** (10 files).
- The new regression test was confirmed to **fail before the fix**, with the blocking
  toast verified as exactly `در حالت کامنت، پیام درخواست شروع ضروری است` (no other
  validation error involved).
- `tsc --noEmit` on both `packages/ui` and `apps/dashboard`: no errors in any touched
  file. Both projects carry a large pre-existing error baseline (shadcn `components/ui/*`
  and `@types/react` resolution), unchanged by this work.

## Out of scope

- The backend needs no change — it already skips the message correctly.
- **Existing rows are not backfilled.** A `justFollowers` + single-PRODUCT automation
  saved before this fix still has a null/empty `commentStartText` in the database, and the
  backend will still try to send it. This fix only makes newly created or re-saved
  automations correct. A backfill (or a backend guard that skips the send when
  `commentStartText` is empty) is the durable fix and is a separate decision — the backend
  guard is the more robust of the two, since it defends every future drift of this kind.
- `apps/admin`'s `TemplateForm.tsx` has no `commentStartText` guard, so it was unaffected.
- `apps/dashboard/src/schemas/automation.ts`'s `AutomationSchema` still types
  `commentStartText`/`commentStartTitle` as required non-null `z.string()`, which does not
  match a backend row where they are null. It is currently used for type inference only
  (never `.parse()`d), so it cannot throw today — left alone rather than widened blindly.
