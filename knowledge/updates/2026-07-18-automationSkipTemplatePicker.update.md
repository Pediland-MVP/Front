# 2026-07-18 — Skip template picker when creating a new automation

Reference code: `apps/dashboard/src/app/(Console)/automations/page.tsx`.

## Problem

Clicking "create automation" on the automations list page always opened
`CreateAutomationTemplateDialog` first, forcing the user to either pick a
template or hit "start from scratch" before reaching the actual builder.

## Solution

`handleCreateAutomationClick` (and the equivalent `handleDraftCreateNew`
branch used when clearing an existing draft) now navigates straight to
`/automations/add` instead of opening the template dialog — the same
behavior the dialog's own "start from scratch" button and the dashboard's
quick-action link already had. `AutomationForm`/`AutomationBuilder` already
handle a template-less `/automations/add` visit correctly (blank defaults,
or resuming a local draft), so no other change was needed.

`CreateAutomationTemplateDialog.tsx` and the shared `TemplatePicker`
component were left in place — `TemplatePicker` is still used by the
in-builder "Template" content-type insert (`Contents.tsx`), and
`CreateAutomationTemplateDialog` remains available if this entry point is
reintroduced later.

## Changes

- `apps/dashboard/src/app/(Console)/automations/page.tsx`: removed
  `isTemplateDialogOpen` state and the `CreateAutomationTemplateDialog`
  render; both `handleCreateAutomationClick` and `handleDraftCreateNew`
  call `router.push('/automations/add')` directly.
- `apps/dashboard/src/app/(Console)/automations/page.test.tsx`: updated to
  assert direct navigation instead of the template-dialog mock.

## Verification

Code-reasoned change plus updated unit test (not run in this session — the
worktree had no `node_modules` yet and the user opted to verify manually
rather than have install/vitest run).
