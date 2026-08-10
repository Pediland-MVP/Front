# 2026-07-18 — Fix contents help trigger rendering pinned at top of page

Reference code: `apps/dashboard/src/components/Automations/AutomationForm.tsx`,
`packages/ui/src/automation-builder/Contents/Contents.tsx`,
`apps/dashboard/src/components/Global/HelpMeDialog.tsx`.

## Problem

The "تعریف محتوای دایرکت هوشمند" help link on the automation contents section
rendered pinned near the top of the whole page instead of next to the
"افزودن مرحله" button, corrupting the page layout. On the pre-refactor `main`
branch the same help link correctly sits next to the "افزودن محتوای دیگر" button.

## Solution

`HelpMeDialog`'s trigger `<span>` defaults to `position: absolute` (via
`getPositionClasses`) unless `noAbsolute` is passed. Every other automation-form
help slot (`triggers`, `conditions`, `justFollowers`, `commentTrigger`) either sets
an explicit `position`/`className` anchored inside a `relative` wrapper, or is
wrapped in a `relative` div by its consuming component. The `contents` slot was
the only one built in `AutomationForm.tsx` with none of that — it defaulted to
`absolute top-2 right-2`, and its wrapper div in `Contents.tsx`
(`<div className="flex shrink-0 items-center justify-center">{helpSlot}</div>`)
isn't `relative`, so the absolutely-positioned span escaped to the nearest
positioned ancestor up the tree, landing near the top of the page.

Fix: added `noAbsolute` to the `contents` `HelpMeDialog` in `AutomationForm.tsx`,
matching the existing `noAbsolute` pattern used elsewhere (e.g.
`app/(Connect)/connect/page.tsx`). The trigger now renders as a normal inline
label inside `Contents.tsx`'s existing flex wrapper, next to the "افزودن مرحله"
button.

## Verification

Code-reasoned fix (1-line change); not visually verified in-browser per user
request — user will verify manually.
