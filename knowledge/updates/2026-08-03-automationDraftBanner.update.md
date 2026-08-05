# Automation Draft: Popup Dialog → In-Page Banner (2026-08-03)

Linear: [BEF-141](https://linear.app/befrooshapp/issue/BEF-141/ux-draft). Front-only, no Back pairing.

## Problem

When a user had an unsaved automation draft and clicked "add automation" on the
automations list page, a blocking `AlertDialog` popped up on that list page, before
navigating, asking to resume or discard the draft. The ticket asked to move this into the
create-automation page itself, as a dismissible banner at the top of the form, and to add
a 2-day max retention for drafts.

## Solution

- `automations/page.tsx`'s "add automation" button now always navigates straight to
  `/automations/add` — no more pre-navigation draft check/dialog.
- `AutomationForm.tsx` (which already read the draft into `initialValue` for a brand-new
  automation) now also tracks whether that value came from a draft (`isFromDraft`). When it
  did, a new `AutomationDraftBanner` renders at the top of the form (`headerSlot`, the
  topmost content inside `AutomationBuilder`'s `<form>`).
  - **"ادامه ویرایش" (Continue editing)** — dismisses the banner only; the draft values stay
    loaded, nothing is cleared.
  - **"پیام جدید" (New message)** — clears the stored draft and resets the mounted form to
    blank in place. `AutomationBuilder` only consumes `initialValue` once, at mount (via
    `useForm`'s `defaultValues`), and has no imperative reset API, so this is done by
    forcing a remount: a `draftDismissedForBlank` flag makes the `initialValue` memo fall
    through to blank defaults, and a `formResetKey` state bumps `AutomationBuilder`'s `key`.
  - Editing the form directly (ignoring the banner) also dismisses it automatically —
    `AutomationDraftWatcher` (already rendered in `headerSlot` to debounce-save the draft)
    gained an `onDirty` callback fired the moment `formState.isDirty` flips true.
- `automationDraft.ts`: `readAutomationDraft` now enforces a 2-day TTL (`DRAFT_TTL_MS`) —
  a draft older than that is treated as absent and its `localStorage` entry is removed.
- Deleted the now-dead `AutomationDraftDialog.tsx` and its `Automations.DraftDialog`
  `fa.json` keys, replaced by `Automations.DraftBanner`.

## Changes

- `apps/dashboard/src/utils/automationDraft.ts` — added `DRAFT_TTL_MS` expiry check.
- `apps/dashboard/src/components/Automations/AutomationDraftBanner.tsx` — new.
- `apps/dashboard/src/components/Automations/AutomationDraftDialog.tsx` — deleted.
- `apps/dashboard/src/components/Automations/AutomationDraftWatcher.tsx` — added optional
  `onDirty` callback.
- `apps/dashboard/src/components/Automations/AutomationForm.tsx` — `initialValue` memo now
  also returns `isFromDraft`; added `showDraftBanner`/`draftDismissedForBlank`/
  `formResetKey` state and the banner's handlers; wired `key`/`headerSlot`.
- `apps/dashboard/src/app/(Console)/automations/page.tsx` — removed all draft-dialog
  state/handlers; button click is a plain `router.push`.
- `apps/dashboard/src/messages/fa.json` — `Automations.DraftDialog` → `Automations.DraftBanner`.

## Review

A `tech-lead-reviewer` pass on the full uncommitted diff came back REQUEST CHANGES with 7
findings, all addressed:

- **Fixed:** `AutomationForm.tsx` failed `prettier --check` (one 102-char line) — reformatted.
- **Fixed:** `AutomationForm.draft.test.tsx`'s `vi.mock('@/utils/automationDraft', …)` factory
  was missing `writeAutomationDraft`, which `AutomationDraftWatcher` imports — a flaky
  unhandled-mock-error risk on a loaded CI box. Added to the mock factory.
- **Fixed:** removed the now-dead `hasAutomationDraft` export (and its tests) — its only
  caller was the deleted list-page pre-navigation check.
- **Fixed (the substantive one):** `onDirty` could fire on a mount-time programmatic dirty
  flip — e.g. `Contents.tsx`'s auto-insert effect calling `setValue(..., {shouldDirty:
  true})` on a restored draft that (rarely) doesn't yet have its CONSENT quick reply —
  dismissing the banner before the user ever saw it. `AutomationDraftWatcher` now only
  calls `onDirty` once a `setTimeout(0)` "arm" timer has fired after mount, so a same-tick
  mount cascade is ignored but any real keystroke (which always lands well after that tick)
  still dismisses the banner. New regression test simulates the cascade directly.
- **Not changed, by design:** `readAutomationDraft`'s TTL eviction runs during the
  `initialValue` render (a render-phase `localStorage.removeItem`) — flagged as a minor
  concurrent-rendering smell, but idempotent and consistent with the pre-existing
  render-phase `readAutomationDraft` call it was already inside; left as a conscious choice.
  Two other findings were informational (a pre-existing, unrelated `automationDefaults`
  staleness quirk; and confirming "پیام جدید" has no undo, matching the ticket's spec as
  written) — no changes made for either.

## Follow-up (2026-08-04): banner grouped into one element

The first version rendered as **two** stacked blocks — an amber `Alert` with the copy, and a
separate row of two buttons *below/outside* it — so it did not read as one alert.

`AutomationDraftBanner.tsx` now renders a **single `Alert`** that holds the icon, the copy,
and both actions:

- The outer `space-y-2` wrapper `<div>` is gone; the `Alert` itself is the root element.
- `Alert` is overridden to `flex-col items-stretch gap-3 sm:flex-row sm:items-center
  sm:justify-between` — copy and actions sit on one line on `sm`+, and stack (full-width
  buttons) on mobile.
- `AlertDescription` gets `min-w-0 flex-1` so long Persian copy wraps instead of squashing
  the buttons.
- Buttons are `size="sm"` and now match the alert's amber theme: "ادامه ویرایش" is the solid
  primary action (`bg-amber-600 text-white hover:bg-amber-700`), "پیام جدید" stays `ghost`
  with amber text. Previously they were the generic `outline` / `ghost` grey styles, which
  clashed with the amber note.

No behavior change — the same `onResume` / `onCreateNew` props and the same i18n keys.
`AutomationDraftBanner.test.tsx` asserts by text, not by structure, so it is unchanged.

## Verification

- Targeted `vitest run` (`pnpm install` run once in this fresh worktree first), all passing:
  - `src/utils/automationDraft.test.ts` — 11/11 (2 new, TTL; `hasAutomationDraft` tests removed)
  - `src/components/Automations/AutomationDraftWatcher.test.tsx` — 6/6 (3 new: `onDirty` fires
    on a real edit, doesn't fire while pristine, ignores a mount-time programmatic dirty flip)
  - `src/components/Automations/AutomationDraftBanner.test.tsx` — 3/3 (new file)
  - `src/components/Automations/AutomationForm.draft.test.tsx` — 8/8 (5 new: banner show/hide,
    resume, new-message reset, auto-dismiss-on-edit)
  - `src/app/(Console)/automations/page.test.tsx` — 1/1 (rewritten, dialog assertions removed)
  - Pre-existing `AutomationForm.test.tsx` / `.templateId.test.tsx` / `.freeQuota.test.tsx` /
    `.submit.test.tsx` — 7/7, unaffected by the `initialValue` memo reshape.
  - `prettier --check` clean on every touched file.
- No manual browser verification yet.
