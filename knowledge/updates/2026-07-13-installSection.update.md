# Install App Section (2026-07-13)

Adds a `/install` page to the dashboard showing Android store links or iOS PWA-install steps depending on the visiting device, plus a "نصب اپلیکیشن" sidebar entry linking to it.

## Problem

There was no in-app place directing users to install the Befroosh Android app or add the PWA to their iPhone home screen.

## Solution

- `apps/dashboard/src/hooks/useDeviceOS.ts` (new): client-only hook (`useDeviceOS()`) plus pure `detectDeviceOS(userAgent)` helper. Classifies the UA as `'android' | 'ios' | 'other'` via `/android/i` and `/iphone|ipad|ipod/i`. Defaults to `'other'` until the post-mount effect runs (same shape as the existing `useIsWebView` hook).
- `apps/dashboard/src/app/(Console)/install/page.tsx` (new): renders an Android card (Cafe Bazaar + Google Play buttons) when `os === 'android' || os === 'other'`, and an iOS card (3-step Safari "Add to Home Screen" instructions, icon-only, no screenshots) when `os === 'ios' || os === 'other'` — so desktop users see both.
- `apps/dashboard/src/components/Layout/ConsoleSidebar.tsx`: added a nav item ("installApp" / "نصب اپلیکیشن", `DownloadSimpleIcon`) linking to `/install`, placed after "settings".
- i18n: new `Install` namespace in `fa.json`/`en.json`; new `Console.Sidebar.installApp` key in `fa/Console.json`/`en/Console.json`.
- `apps/dashboard/e2e/tests/install/install.spec.ts` (new): Playwright coverage for Android/iOS/desktop UA rendering and the sidebar link.

## Verification

- `npx tsc --noEmit` in `apps/dashboard`: only pre-existing baseline errors remain.
- `npx eslint` on all touched files: 0 errors.
- `npx playwright test e2e/tests/install/install.spec.ts`: 4/4 pass.
