# Smart Consent Disable — Skip Redundant Start-Request Card (2026-08-01)

Linear: [BEF-162](https://linear.app/befrooshapp/issue/BEF-162/pyam-drkhwast-shrwa) (continuation, after the "do now vs backlog" line).
Paired Back branch: `feat/bef-162-smart-consent-disable`.

## Problem

`StartAutomationMessage.tsx`'s activation effect showed the "start request" card whenever
a comment-triggered automation had more than one content, regardless of whether
`content[0]` already forces the user to tap/answer something itself — a `TEXT` content
that already has quick replies (which always gets the auto-inserted CONSENT quick reply
in `Contents.tsx` whenever another content follows it), or a `QUESTION` content. In both
cases the card was pure redundancy: the user already has to interact with `content[0]`
before anything else can send.

## Solution

Added a `firstContentSelfGates` check to the activation effect: `content[0].type ===
QUESTION`, or `content[0].type === TEXT && content[0].quickReplies?.length > 0`. When
either is true, the card no longer activates (and `commentStartText` is cleared, same as
the existing "not active" branch).

The `quickReplies?.length > 0` check (rather than checking specifically for the CONSENT
quick reply's presence) was chosen deliberately: `Contents.tsx`'s auto-insert effect only
ever adds the CONSENT quick reply onto a TEXT content that **already** has at least one
quick reply — so checking for non-empty `quickReplies` matches that effect's exact
precondition without depending on effect-ordering between the two sibling components (both
subscribe to the same form's `watch('contents')`, so there's no guarantee the CONSENT
insert has already run before this effect evaluates on a given render).

## Changes

- `packages/ui/src/automation-builder/Contents/StartAutomationMessage.tsx` — added the
  `firstContentSelfGates` check inside the existing `shouldActivate` effect.
- `packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx` — 3 new tests
  in the `StartAutomationMessage` describe block: hides for TEXT-with-quick-reply
  content[0], hides for QUESTION content[0], and a regression guard confirming it still
  shows for TEXT-with-**no**-quick-replies content[0].

## Out of scope

Same exclusions as the paired Back doc: BUTTON_TEMPLATE/VITRIN as `content[0]` are not
treated as self-gating here either, since the Back's `shouldPauseForConsent` doesn't
recognize them as pause points yet — showing this card correctly stays the safe default
for those types.

## Verification

- Targeted `vitest run`, all passing:
  - `packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx` — 28/28 (3 new)
  - `packages/ui/src/automation-builder/__tests__/AutomationBuilder.test.tsx` — 6/6
  - `apps/dashboard/src/components/Automations/AutomationForm.test.tsx` — 2/2
- No manual browser verification performed yet.
