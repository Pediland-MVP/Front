# Install Section Design (2026-07-13)

## Goal

Add a "/install" page to the dashboard (`Front/apps/dashboard`) that helps users install
our Android app, and add a "نصب اپلیکیشن" sidebar button that links to it.

## Branch

`feat/install-section`, forked from `merged-admin`, in a dedicated worktree (per CLAUDE.md
worktree rule).

## Page: `/install`

- New route: `src/app/(Console)/install/page.tsx` (client component), same tier as
  `/help/support` — rendered inside the existing `(Console)` layout, so the sidebar stays
  visible.
- Visual style follows `SupportPage` (`src/app/(Support)/support/page.tsx`): a title/description
  header, then `Card`/`CardContent` blocks for each section. Phosphor icons throughout
  (`@phosphor-icons/react/dist/ssr`), consistent with the rest of the app.

### Content by detected device

A new hook, `src/hooks/useDeviceOS.ts`, reads `navigator.userAgent` client-side and
returns `'android' | 'ios' | 'other'`:
- `android`: matches `/android/i`
- `ios`: matches `/iphone|ipad|ipod/i`
- `other`: neither (desktop, etc.)

No existing utility covers this (`useIsWebView` only flags Android's in-app WebView;
`isStandalone` only detects iOS PWA standalone mode) — this is a small new addition.

Rendering:
- **Android** (`useDeviceOS() === 'android'`): show two link buttons/cards side by side —
  Cafe Bazaar (`https://cafebazaar.ir/app/app.befroosh`) and Google Play
  (`https://play.google.com/store/apps/details?id=app.befrooshm&pli=1`). Each opens in a
  new tab (`target="_blank" rel="noopener noreferrer"`).
- **iOS** (`useDeviceOS() === 'ios'`): numbered step-by-step instructions for adding the
  PWA from Safari's Share menu (tap Share → "Add to Home Screen" → tap Add). Each step
  gets a small Phosphor icon (e.g. `ShareIcon`, `PlusSquareIcon`, `CheckCircleIcon`) instead
  of screenshots, to stay lightweight and match the icon-driven style used elsewhere (e.g.
  `SupportPage`'s contact method cards).
- **other** (desktop/unknown): show **both** sections together (Android buttons + iOS
  steps), so a desktop user can view everything and, e.g., send themselves the links.

No smart store-detection on Android — both store buttons always show together, kept simple.

## Sidebar entry

In `src/components/Layout/ConsoleSidebar.tsx`, add one item to `generateData()`'s
`navMain` array, using the same shape as existing items:

```js
{
  title: t('installApp'),
  url: '/install',
  icon: DownloadSimpleIcon, // from @phosphor-icons/react/dist/ssr
  isActive: true,
},
```

Placed after `settings`, before `learn`/`support` (grouped with the other
help/utility-style links at the bottom of the nav).

## i18n

- `Console.Sidebar.installApp` key added to `src/messages/fa/Console.json` and
  `src/messages/en/Console.json` (value: `"نصب اپلیکیشن"` / best-effort English).
- A new top-level `Install` namespace added to `src/messages/fa.json` (and `en.json`,
  best-effort) for page copy: title, description, Android section header, iOS section
  header + step texts. Read via `useTranslations('Install')` in the new page, matching the
  `Support` page's pattern (`useTranslations('Support')`, keys living in the shared
  `fa.json`/`en.json` rather than a per-domain file, since `Support` follows that same
  layout).

## Testing / verification

No backend involved; this is a static, client-rendered page reading `navigator.userAgent`.
Verification is manual: run the dashboard dev server, and use Chrome devtools device
emulation (or a real phone) to confirm:
- Android UA → shows both store buttons, links resolve to the right URLs.
- iOS UA → shows step-by-step Safari instructions.
- Desktop UA → shows both sections.
- Sidebar shows the new "نصب اپلیکیشن" button and it navigates to `/install`.

## Out of scope

- No PWA manifest/service-worker changes — this page only gives instructions for an
  existing PWA setup (or a wrapped native install), assumed already in place.
- No analytics/tracking on install-button clicks.
- No screenshots/graphics for iOS steps — icons only.
