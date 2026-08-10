# General UI Fixes Bundle (2026-08-03)

Linear: [BEF-163](https://linear.app/befrooshapp/issue/BEF-163/aslahat-amwmy-ui).

## Problem

Six unrelated UI complaints bundled in one ticket, mostly (but not only) inside
the Automation create/list flow:

1. Radix `Select` dropdowns rendered left-aligned in the Persian (RTL) UI.
2. The comment/DM hourly-cap disclaimer inside the Automation builder had
   stale copy (still said the old 100/hour cap) and wrapped oddly instead of
   spanning the full width of its alert box.
3. The account-sessions page ("Active devices"): no working horizontal
   scroll on mobile (columns just overflowed the viewport with no way to
   reach them), English breadcrumb segment, generic title.
4. The mobile bottom nav bar's 5 icons weren't vertically level.
5. The Automation create form's "select pages" picker still rendered (empty,
   forcing a manual click) for workspaces with only one connected Instagram
   page.
6. The subscription-renewal dialog showed an unnecessary "already has an
   active subscription" notice, and put the discount-code field at the very
   top of the form — driving support tickets asking for codes before users
   even picked a plan.

## Root causes & solutions

1. **RTL dropdowns**: `@radix-ui/react-select` resolves its own `dir` via
   `@radix-ui/react-direction`'s `useDirection()`, which defaults to `"ltr"`
   without an ancestor `<DirectionProvider>` — so every Select rendered with
   a literal `dir="ltr"` regardless of the page's `<html dir="rtl">`. The
   `apps/admin` app already had this fixed via a `RadixDirectionProvider`
   wrapper; `apps/dashboard` was missing it entirely. Added the same
   component (`apps/dashboard/src/components/RadixDirectionProvider.tsx`)
   and wrapped `{children}` in `apps/dashboard/src/app/layout.tsx`. Fixes
   every Radix primitive app-wide (Select, Popover, DropdownMenu, etc.), not
   just the one dropdown from the screenshot.
2. **Disclaimer text/layout**: `AlertDescription` (shared `packages/ui`
   primitive, "DO NOT overwrite") is a flex item with no explicit width, so
   it hugs its content instead of stretching to the alert's full width.
   Fixed at the call site (not the shared primitive) by passing
   `className="w-full"` in `CommentLimitAlert.tsx`. Copy updated in
   `fa.json`'s `Automations.TargetPostComment.note` to the new wording, using
   **300** comments/hour (not the ticket's literal 100) since the backend
   cap was already raised 100→300 and deployed to prod on 2026-07-31/08-02
   (see `Back` `WORKTREES.md` `reply-comment-rate-limit` row) — confirmed
   with the user before writing the copy.
3. **Sessions page**: horizontal scroll was dead because the page's
   `<div className="flex-1">` wrapper (a flex item inside `LayoutSettings`'s
   column flex container) had no `min-width: 0`, so instead of clipping/
   scrolling internally it just stretched the whole layout to the table's
   content width. Added `min-w-0`. Renamed the page title
   (`Settings.AccountSessions.title`) to "دستگاه‌های فعال". Added a
   `HeaderBreadcrumb` case + `Breadcrumbs.account_session_management` key
   for the `account-session-management` path segment (previously fell
   through to the raw, untranslated URL segment). Renamed the per-row
   action label from "بستن نشست" to "خروج از این دستگاه" to match the
   ticket's wording. **Not changed**: the backend (`AccountSessionsService.
   readUserSessions`) already returns only live `RefreshToken` rows — there
   is no soft-revoke/expiry flag, sessions are hard-deleted on terminate, so
   there was never an "invalidated sessions" state to filter out; every row
   already shown was a genuinely active session. The 5-day min-age
   termination guard (`SESSION_TERMINATE_MIN_AGE_MS`) was left untouched —
   it's an intentional, explicitly-commented server-side rule, not a bug.
4. **Bottom nav alignment**: the 5 items had inconsistent icon sizes (28
   default / 32 "add" / 30 profile) and inconsistent label typography (`mt-1
   text-xs` vs. the profile button's `mt-0.5 text-[10px]`). Since each
   column centers its *whole* icon+label stack via `justify-center`, taller
   stacks shift their icon higher than shorter stacks even though every
   column has the same container height. Normalized all 5 items to the same
   28px icon size and the same `mt-1 text-xs` label styling in
   `NavBottom.tsx`.
5. **Single-page workspace picker**: `InstagramSelectField.tsx` only hid
   itself at `accounts.length === 0` (zero pages), not one — changed the
   guard to `accounts.length <= 1`. Since `instagramIds` is a required,
   non-empty field on the automation schema, hiding the picker needed a
   matching auto-select: added a `useEffect` that sets `instagramIds` to
   `[account.id]` whenever the workspace has exactly one connected page, so
   creating/editing an automation never silently blocks on an empty
   required field. The automations *list* page's `InstagramFilter` was
   already correctly gated at `accounts.length <= 1` — no change needed
   there.
6. **Subscription renewal form**: removed the
   `renewal_will_queue_notice` block (and its now-dead `fa.json`/`en.json`
   keys, and the now-unused `isSelectedPageAlreadyCovered` variable in
   `ChoosePlan.tsx`). Consolidated the previously-duplicated
   desktop/mobile `<DiscountCode/>`+`<DiscountAlert/>` blocks (each
   toggled via `hidden md:block`/`block md:hidden`) into a single instance
   placed after the duration/price cards, inside the same grid column the
   duration cards live in — so it now renders at the actual end of the form
   on both breakpoints instead of before plan selection.

## Changes

- `apps/dashboard/src/components/RadixDirectionProvider.tsx` (new)
- `apps/dashboard/src/app/layout.tsx`
- `packages/ui/src/automation-builder/Form/CommentLimitAlert.tsx`
- `apps/dashboard/src/app/(Console)/settings/account-session-management/page.tsx`
- `apps/dashboard/src/components/Layout/HeaderBreadcrumb.tsx`
- `apps/dashboard/src/components/Layout/NavBottom.tsx`
- `apps/dashboard/src/components/Automations/Form/InstagramSelectField.tsx`
- `apps/dashboard/src/components/Settings/ChoosePlan.tsx`
- `apps/dashboard/src/messages/fa.json`, `en.json`

## Out of scope / not touched

- The shared `select.tsx`/`alert.tsx` primitives (marked "DO NOT overwrite")
  were never edited — both fixes applied at call sites or the app root.
- No change to `SESSION_TERMINATE_MIN_AGE_MS` (5-day rule) or any backend
  session/revocation semantics.
- No manual in-browser verification yet (no dev server run this session).

## Verification

- Targeted `vitest run`, all passing:
  - `apps/dashboard/src/components/Automations/AutomationForm.freeQuota.test.tsx` (3 tests)
  - `apps/dashboard/src/components/Automations/AutomationForm.submit.test.tsx` (1 test)
  - `packages/ui/src/automation-builder/__tests__/AutomationBuilder.test.tsx` (6 tests)
- `tsc --noEmit` on `apps/dashboard`: pre-existing baseline errors only; the
  one error touching a file in this change (`ChoosePlan.tsx`, a `zod`
  resolver-type mismatch) is identical before/after this branch, just at a
  shifted line number.
- `fa.json`/`en.json` validated as parseable JSON after every edit.
