# SetupInstagramDialog gains a workspace-choice step (2026-08-10)

Related prior docs:
`knowledge/updates/2026-08-09-setupDialogUnboundStep.update.md`,
`knowledge/updates/2026-08-08-setupInstagramDialogRedesign.update.md`

## Problem

`SetupInstagramDialog` always bought the plan into whatever workspace happened to be active. A
user adding a page that's really a separate business, or one that belongs to a different existing
workspace they own, had no way to say so before paying.

## Solution

The dialog is now a 3-step wizard (`آیدی اینستاگرام` → `بررسی اطلاعات و هزینه` → `انتخاب کسب و کار`)
with a 3-rectangle progress header (`WizardStepsHeader`). Selecting a plan/duration on step 2 no
longer buys immediately — it just selects, and step 3 asks whether the page goes into a brand-new
workspace (name + category form) or a different existing one (a `Select`, defaulting to the
current workspace with `" (فعلی)"` appended to its label). The workspace-choice branching state
lives in a small standalone hook, `useWorkspaceTargetStep`.

If the resolved target is the current workspace, payment fires immediately (`usePayPlan`,
unchanged). Otherwise: create the workspace if new (`POST /workspaces`), stamp
`igwResume`/`igwPlanId`/`igwDurationId`/`igwUsername`/`igwTargetWs` onto the URL via
`window.history.replaceState` (survives the reload since it's the same URL), then call the
existing `useWorkspaces().changeWorkspace`, which posts `/auth/changeWorkspace` and hard-reloads.
If that POST fails, the just-stamped params are stripped again so they can't be misread as a
successful switch on some later, unrelated refresh.

After reload, a new hook (`useInstagramWizardResume`) reads those params, waits for
`usePermissions().workspaceId` to resolve, and only then either fires `pay()` automatically (the
switch landed) or shows a mismatch error and leaves the user on step 3 to retry (the switch did
not land) — this is the safety check that keeps a failed/racy switch from ever paying into the
wrong workspace. Both host pages (`settings/instagram/page.tsx`, `connect/page.tsx`) gained a
2-line effect that reopens the dialog when `igwResume=1` is present.

Step 2 also gained a small profile card (avatar/username/follower count), fed by a backend change
— see `Back/knowledge/updates/2026-08-10-instagramWorkspacePickerWizard.update.md`.

The Apify-failure manual-plan-picker path is unchanged in substance, just also feeds into step 3
the same way the matched-plan path does. Going back to step 1 and checking a different username
now correctly clears any stale plan/duration selection from the previous username, so the wizard
can never finalize a purchase for the wrong plan.

## Changes

- `apps/dashboard/src/components/Connect/useWorkspaceTargetStep.ts` — new hook, the create-vs-
  merge branching logic (isolated from the Radix `Select`/`RadioGroup` UI so it's testable without
  them).
- `apps/dashboard/src/components/Connect/WizardStepsHeader.tsx` — new, the progress header.
- `apps/dashboard/src/components/Connect/useInstagramWizardResume.ts` — new, the post-reload
  resume/verify hook.
- `apps/dashboard/src/components/Connect/SetupInstagramDialog.tsx` — restructured into the 3 steps
  described above; per-duration/per-plan "buy" buttons became selection highlights; the single
  step-3 button does the real work (pay directly, or create+switch+reload).
- `apps/dashboard/src/types/instagram.ts` — `FollowersLookup` gains optional `profilePicUrl`/
  `fullName`.
- `apps/dashboard/src/app/(Console)/settings/instagram/page.tsx`,
  `apps/dashboard/src/app/(Connect)/connect/page.tsx` — 2-line effect each, reopening the dialog on
  `igwResume=1`.
- `apps/dashboard/src/messages/fa.json` — new `SetupInstagramDialog` keys for the steps, nav
  buttons, the two workspace options, and the workspace-create/switch error toasts.
- `knowledge/front-back-relations.md` — documents the `profilePicUrl`/`fullName` addition to
  `GET /instagram/lookup-followers`.

## Verification

- `npx vitest run src/components/Connect/useWorkspaceTargetStep.test.ts` — 8/8 pass.
- `npx vitest run src/components/Connect/WizardStepsHeader.test.tsx` — 2/2 pass.
- `npx vitest run src/components/Connect/useInstagramWizardResume.test.ts` — 4/4 pass.
- `npx vitest run src/components/Connect/SetupInstagramDialog.test.tsx` — 18/18 pass.
- `npx vitest run "src/app/(Console)/settings/instagram/page.test.tsx"` — 12/12 pass.
- `npx vitest run "src/app/(Connect)/connect/page.test.tsx"` — 10/10 pass.
- Built via subagent-driven-development (6 implementer dispatches + task review after each; 2 fix
  rounds — a stale one-shot-default bug in `useWorkspaceTargetStep`'s `reset()`, and a stale
  plan/duration selection surviving a username re-check in `SetupInstagramDialog`).
- Not manually verified in-browser (dev server not started for this change, per project
  convention of not running dev servers without asking each time).
