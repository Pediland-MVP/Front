# Instagram Settings UI Polish (2026-07-10)

A visual/UX redesign of the `settings/instagram` page in the dashboard, keeping the
existing design system (violet `primary`, blue `secondary`, `Card`/`Button` primitives,
RTL Persian-first) but improving hierarchy, spacing, responsiveness, and states.

Builds on `2026-07-04-multiSubscriptionUiFix.update.md` (which added `PageCoverageBadge` /
`PagePromotionAlert` inside each page card) — those coverage components are unchanged.

## Problem

The page worked but read as unpolished:

- **Header** was a bare `h2` (`text-primary font-semibold`) + Add button. No subtitle, no
  icon, no page-count context. The `description` i18n key existed but was unused.
- **Cards** used `shadow-violet-200` with no shadow-size utility (a tinted-but-flat look),
  a flat avatar, and a 3-button footer glued onto a `bg-gray-100` bar with mixed hover
  tints — cramped at the `md:grid-cols-3` breakpoint, and the "relogin" label duplicated
  the destructive badge text.
- **States** were thin: permission-denied was a plain bordered text box; there was no
  friendly empty state (an empty `data` array rendered nothing); the at-limit note was a
  bare gray line; the permission-loading spinner was a bespoke inline `div`.

## Solution

Kept all data/logic (SWR fetch, `onCountChange`, delete flow, permission gating, and the
"first page has invalid token → return null so `InstagramInvalidDialog` takes over"
behavior). Everything below is presentation only.

- **New reusable accent** — `.bg-instagram` in `styles/globals.css` (an Instagram brand
  gradient), added next to the existing `.text-gradient`. Used as the *one* signature
  element, with restraint: the header icon tile, the avatar ring on valid pages, and the
  empty-state icon. Invalid pages get a gray ring instead so state reads at a glance.
- **`settings/instagram/page.tsx`** — rebuilt header: gradient IG icon tile + `title` +
  new `subtitle`, with a `count_badge` pill (`{count} از {max} پیج`) and the Add button on
  the end. Header now always renders (stable during permission load). Loading uses the
  shared `LoaderSpin`; at-limit is an amber warning row; permission-denied is a centered
  dashed-border state card with a lock icon.
- **`components/Settings/InstagramAccounts.tsx`** — grid is now
  `sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4` (was `md:grid-cols-3 2xl:grid-cols-4`).
  Cards: gradient/gray avatar ring (white inner border), hover lift
  (`hover:-translate-y-0.5` + real `shadow-lg`), a fade-in external-link arrow on the
  clickable header, and a footer rebuilt as a bordered row (`border-t` + `border-s`
  dividers, RTL-safe logical borders, `h-10`, per-action hover tints). The relogin badge
  became a self-styled `span` (avoids the repo-wide broken `Badge` children type — see
  Verification) with a warning icon and the clearer `need_relogin` label; the reconnect
  button uses `reconnect` (`اتصال مجدد`) and copy uses the shorter `copy_short`. Added a
  friendly **empty state** (gradient icon + connect CTA) for the `data.length === 0` case.
  The coverage/promotion band now only renders for valid pages.

## Changes

- Modified: `apps/dashboard/src/styles/globals.css` (new `.bg-instagram`),
  `apps/dashboard/src/app/(Console)/settings/instagram/page.tsx`,
  `apps/dashboard/src/components/Settings/InstagramAccounts.tsx`.
- i18n (`Settings.Accounts`, fa only per project rule — en added later): `subtitle`,
  `count_badge`, `copy_short`, `reconnect`, `need_relogin`, `empty_title`,
  `empty_description`, `permission_denied_title`, `permission_denied_description`.
- No backend changes. Sub-components `PageCoverageBadge` / `PagePromotionAlert` untouched.

## Verification

- Visual: iterated on a faithful standalone RTL mockup (real oklch tokens) and screenshotted
  header, all four card variants (covered / expiring / promotion / invalid), empty state, and
  permission state before porting to the real components.
- `tsc --noEmit` on the two changed `.tsx` files → no errors. `eslint` on both → 0 errors
  (only two pre-existing unused-var warnings: `MAX_INSTAGRAM_ACCOUNTS`, `mutateLocal`, both
  present before this change). The Badge-children type error is a known repo-wide issue and
  was sidestepped by using a styled `span`.
