# Ice Breakers — پیام خوش‌آمدگویی (2026-08-28)

Backend half: `Back/knowledge/updates/2026-08-28-iceBreakers.update.md`
Full backend reference: `Back/knowledge/core/instagrams/iceBreakers.doc.md`
API contract: `Front/knowledge/front-back-relations.md`

## Problem

Instagram can show up to 4 tappable questions in an **empty** DM thread, each
starting an automation. There was no UI to configure them, and no nav home for
them either — `اتوماسیون‌ها` was a single flat sidebar link.

## Solution

`اتوماسیون‌ها` becomes a collapsible sidebar **parent** with two children:

| Label | Route |
|---|---|
| `اتوماسیون‌ها` | `/automations` (`exact: true`) |
| `پیام خوش‌آمدگویی` | `/automations/welcome` |

`NavMain` already supported sub-items, so no component change was needed — but the
first child **must** carry `exact: true`. `NavMain` matches sub-items with
`startsWith` by default, so without it both rows highlight on
`/automations/welcome`. There is a regression test for exactly this.

The page edits one Instagram page at a time (ice breakers are stored per account
on Meta's side, four per account), with a page picker at the top, up to 4 slots,
and per-locale tabs (`default` required, `fa_IR`, `en_US` optional).

## Changes

### New

- `src/app/(Console)/automations/welcome/page.tsx`
- `src/components/Automations/WelcomeMessageManager.tsx` — the editor.
- `src/hooks/useIceBreakers.ts` — SWR reads keyed on `instagramId` (null key until
  a page is chosen, so switching pages refetches instead of showing stale slots),
  plus the save mutation.
- `src/types/iceBreaker.ts`

### Changed

- `src/components/Layout/ConsoleSidebar.tsx` — automations parent + children,
  `HandWavingIcon` for the new entry.
- `src/components/Layout/HeaderBreadcrumb.tsx` — `welcome` added to
  `knownSegmentKey()`. **Required by CLAUDE.md §18.5** — without it the breadcrumb
  silently falls back to the raw URL slug.
- `src/messages/fa.json` — `Breadcrumbs.welcome` + new `WelcomeMessage` namespace.
- `src/messages/fa/Console.json` — `Console.Sidebar.welcomeMessage`.
- `src/messages/fa/ErrorCodes.json` — `ICE_BREAKER_LIMIT_EXCEEDED`,
  `ICE_BREAKER_AUTOMATION_NOT_BINDABLE`. (This is the authoritative ERROR_CODES
  file; `fa.json`'s copy is dead at runtime — see the note in
  `front-back-relations.md`.)
- `src/components/Layout/ConsoleSidebar.test.tsx` — the `next/navigation` mock is
  now mutable (`vi.hoisted`) because the automations parent is a Radix Collapsible
  that does not mount its children while closed, so asserting on the sub-items
  requires putting the router on `/automations/welcome`.

## Behaviour worth knowing

- **Saving is a whole-list replace.** There is no partial update and no per-slot
  delete, because Meta replaces the entire `ice_breakers` field on every push.
  Always send every slot. Reordering is just array order — never send `sortOrder`.
- **Saving IS publishing.** The push to Instagram runs inside the same request, so
  a success genuinely means the questions are live — the toast says
  *"پیام خوش‌آمدگویی ذخیره و روی اینستاگرام منتشر شد."* A failure surfaces as a
  toast carrying the real reason (`INSTAGRAM_TOKEN_EXPIRED` /
  `ICE_BREAKER_SYNC_FAILED`), never an in-page banner.
- `syncedAt` / `syncError` from the GET cover only the failures the user did not
  cause directly — a non-fatal re-push after an automation is deleted or the
  account is reconnected.
- Automations **linked to the selected page** appear in the dropdown; the backend
  re-checks the linkage on save. `isDirect` is deliberately not required — see the
  Back update doc.

## Bug found and fixed after first run (2026-08-29)

The page crashed on load with **"Maximum update depth exceeded"**. Two defects,
both mine, both in the draft-seeding path:

1. **`useIceBreakers` returned `listData?.data?.items ?? []`.** The `?? []`
   allocates a **new array every render**, and the component listed that array in
   a `useEffect` dependency array. While the list request was still pending the
   effect fired on every render, called `setSlots` with a fresh array, re-rendered,
   and looped forever. Fixed with module-level frozen `EMPTY_*` constants so the
   fallback has one stable identity. **Any hook here that returns `?? []` and is
   consumed in a dependency array has this bug** — worth remembering.
2. **The same effect clobbered unsaved edits.** It re-seeded whenever the ice
   breaker array changed, and SWR revalidates on window focus and after every
   save — so half-typed text would silently vanish. Now seeded **once per page**
   via a `seededForPageRef`, plus a new `isListLoaded` flag from the hook so "empty
   list from a real response" is distinguishable from "no response yet".

Also fixed a *"Select is changing from uncontrolled to controlled"* warning from
both Selects: they now pass `''` rather than `undefined` for "nothing chosen".
Radix still shows the placeholder for `''`, but the component stays controlled for
its whole lifetime.

`WelcomeMessageManager.test.tsx` covers this. The loop test was confirmed **red
first** — with the fix reverted it exhausts the V8 heap rather than merely failing,
which is what the runaway loop looks like from the test runner.

## UI rework (2026-08-29)

The first pass was bespoke and did not look like the rest of the dashboard. Rebuilt
against the existing automation patterns:

- **Automations are picked with the shared `AutomationSearchSelect`**, the same
  component the START_AUTOMATION button picker uses, so an automation is labelled
  by its **trigger keywords** rather than a title or id. Its own
  `GET /contentCycle/conditions` request is reused, and the `/ice-breakers/bindable-automations`
  endpoint was deleted. The component gained two optional props — `instagramIds`
  (that endpoint is `@ArrayNotEmpty`, so the account must be passed) and
  `placeholder` — both defaulted so the product-vitrin call site is unchanged. A
  stray `console.log` firing on every mount was removed while there.
- **Multi-locale UI dropped.** Storage stays per locale, but the dashboard writes
  `default` only — Meta shows `default` to everyone whose app language has no
  specific entry, which is all of our users. No locale tabs.
- **Layout matches `FormVitrinButtons`**: `Card` + `CardHeader`/`CardTitle` (icon +
  text) + `CardDescription`, an outline `size="sm"` add button with `CirclePlusIcon`,
  rows as `flex items-start gap-1.5` with a trailing `variant="outline" size="icon"`
  delete carrying `Trash2Icon className="text-destructive"`.
- **Page picker matches the automation builder's `InstagramSelectField`** — same
  trigger, popover, avatar and violet selection colours — but single-select, and
  hidden entirely for a one-page workspace. New `IceBreakerPageSelect.tsx`.
- **Alerts and messages are the shared ones**: `ConnectInstagramAlert` for "no
  page connected", `LoaderSpin` while loading, `ErrorMessage` for per-row and load
  errors, and a dashed empty state instead of a bare editor.
- **A failed push to Instagram is a TOAST, not an in-page banner** (2026-08-29).
  It is status about Meta, not about the form the user is looking at. The
  "saved but not published yet" banner was removed outright.

  Since the push now runs **inside the save request** (the queue is gone), the
  save reports its own outcome directly and the success toast says the questions
  are live. The load-time effect only covers the other way a failure appears —
  the state left by a knock-on re-push (automation deleted, account reconnected).
  Two guards keep it from doubling up: a ref keyed on `instagramId:syncError`
  stops SWR revalidations re-announcing the same failure, and
  `suppressSyncToastRef` covers the save round-trip, where `handleSave` has
  already toasted the real outcome.

  New Persian keys: `ICE_BREAKER_SYNC_FAILED` and `INSTAGRAM_TOKEN_EXPIRED` (the
  latter existed in the backend union but had **no** frontend translation, so the
  toast would have shown the raw key path). `t_ec` is now only called with a real
  code, since next-intl renders the key path for a missing one.
- Validation is now per row and only surfaces **after** a save attempt, rather
  than a single banner disabling the button from the start.

## Verification

- `tsc --noEmit`: **188 errors, all pre-existing**; zero in any file touched here
  (checked per-file against the changed-file list).
- `vitest run` (whole dashboard suite): **36 files, 214 tests, all pass**,
  including 3 sidebar tests, 8 `WelcomeMessageManager` tests, and the pre-existing
  `i18n/messages.test.ts` key-parity check.
- `tsc`: 186 errors, all pre-existing, zero in any file touched here.

## Not done

- The tests cover rendering, the render-loop regression and the empty states, but
  not the save flow (validation messages, the whole-list POST body, the toast).
- Not exercised against a real Instagram account end-to-end; the backend's write
  path to Meta is still unverified (see the Back update doc).
