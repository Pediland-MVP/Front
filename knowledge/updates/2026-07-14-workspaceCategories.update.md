# Workspace Categories — 2026-07-14

Full reference: `Back/knowledge/admin/workspaceCategories/workspaceCategories.doc.md`.

## Problem
No way for users to categorize a workspace, or for admins to manage a category
taxonomy, and no path to backfill category on workspaces created before this
feature shipped.

## Solution
- Admin: new `/workspace-categories` page (list/search/paginate/create/edit/
  delete), plus a `category` column + filter on the existing `/workspaces` page.
- Dashboard: category `Select` added to the "new workspace" dialog (required to
  submit) and to the onboarding form (required to submit). A new
  `WorkspaceCategoryGuard` component, mounted in the Console layout, shows a
  non-cancelable dialog forcing the **owner** of the **active** workspace to
  pick a category when it has none — non-owners are never blocked.

## Changes
- `apps/admin/src/app/(main)/workspace-categories/*` (new)
- `apps/admin/src/app/(main)/workspaces/{columns,workspace-table,client-page}.tsx`
- `apps/dashboard/src/hooks/useWorkspaceCategories.ts` (new)
- `apps/dashboard/src/components/Console/WorkspaceCategoryGuard.tsx` (new)
- `apps/dashboard/src/app/(Console)/workspace/page.tsx`,
  `apps/dashboard/src/app/(Auth)/auth/onboarding/page.tsx`,
  `apps/dashboard/src/app/(Console)/layout.tsx`

## Verification
No automated test runner in either frontend app (project convention) — verified
manually: category required on workspace creation and onboarding; forced
dialog appears only for the owner of an uncategorized active workspace and
cannot be dismissed without picking a category; admin CRUD create/edit/search/
paginate/delete-blocked-while-in-use all confirmed via the dev server.
