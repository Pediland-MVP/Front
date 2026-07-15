# Install Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/install` page to `apps/dashboard` that shows Android store links (Cafe Bazaar, Google Play) or iOS PWA-install steps based on the visiting device, plus a "نصب اپلیکیشن" sidebar button that links to it.

**Architecture:** A client-only `useDeviceOS()` hook reads `navigator.userAgent` after mount to classify the device as `'android' | 'ios' | 'other'`. A new `/install` page (same tier as the existing `/help/support` page, inside the `(Console)` layout so the sidebar stays visible) conditionally renders an Android card, an iOS card, or both, based on that classification. One new nav item is added to the existing sidebar data array.

**Tech Stack:** Next.js (App Router) client components, `next-intl` (`useTranslations`), Tailwind, `@phosphor-icons/react/dist/ssr`, existing `@/components/ui` (`Button`, `Card`, `CardContent`). Testing follows this repo's actual working test tool — Playwright e2e (`apps/dashboard/e2e`) — since no unit-test runner is wired up for `apps/dashboard` (vitest is installed but has no config/scripts/existing tests).

## Global Constraints

- Repo root for all file paths below: `Front/worktrees/install-section/apps/dashboard/` (the branch `feat/install-section` worktree). Do not touch the main `Front/` checkout.
- All user-facing text must go through `next-intl` (`useTranslations`) — never hardcode Persian/English strings in JSX (CLAUDE.md §8).
- Add every new key to `fa.json`/`Console.json` (fa) — the authoritative source — and add best-effort English equivalents to `en.json`/`Console.json` (en) at the same time, matching the existing `Support` section's bilingual pattern.
- Android store URLs (exact, do not alter):
  - Cafe Bazaar: `https://cafebazaar.ir/app/app.befroosh`
  - Google Play: `https://play.google.com/store/apps/details?id=app.befrooshm&pli=1`
- Sidebar button label (fa): `نصب اپلیکیشن`.
- No PWA manifest/service-worker changes, no click analytics, no screenshots/graphics for iOS steps (icons only) — explicitly out of scope.
- Follow existing file/style conventions: Phosphor icons (`@phosphor-icons/react/dist/ssr`), `cn()` from `@/lib/utils`, Tailwind utility classes matching `SupportPage`'s look (`text-gray-800`, `text-gray-500`, rounded cards, etc.).

---

### Task 1: `useDeviceOS` hook

**Files:**
- Create: `apps/dashboard/src/hooks/useDeviceOS.ts`

**Interfaces:**
- Produces: `export type DeviceOS = 'android' | 'ios' | 'other'`, `export function detectDeviceOS(userAgent: string): DeviceOS` (pure, exported for direct import in the e2e-adjacent sanity check in Task 5's page, and for potential future reuse), `export function useDeviceOS(): DeviceOS` (client hook, defaults to `'other'` until the effect runs post-mount, then re-renders with the real value — same "default-then-correct-after-mount" shape as the existing `useIsWebView` hook at `apps/dashboard/src/hooks/useIsWebView.ts`).

- [ ] **Step 1: Write the hook**

```ts
'use client';

import { useEffect, useState } from 'react';

export type DeviceOS = 'android' | 'ios' | 'other';

export function detectDeviceOS(userAgent: string): DeviceOS {
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  return 'other';
}

export function useDeviceOS(): DeviceOS {
  const [os, setOs] = useState<DeviceOS>('other');

  useEffect(() => {
    setOs(detectDeviceOS(navigator.userAgent));
  }, []);

  return os;
}
```

- [ ] **Step 2: Sanity-check the pure function in a scratch file**

There is no unit-test runner wired for `apps/dashboard` (no `vitest` script, no existing `*.test.ts` files, no jsdom/testing-library setup) — introducing one is out of scope for this feature (YAGNI; the project's actual working test suite is Playwright e2e, exercised in Task 5). Instead, sanity-check the pure function once with a throwaway Node script, then delete it:

```bash
cd apps/dashboard && node -e "
const { detectDeviceOS } = (() => {
  function detectDeviceOS(userAgent) {
    if (/android/i.test(userAgent)) return 'android';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
    return 'other';
  }
  return { detectDeviceOS };
})();
console.log(detectDeviceOS('Mozilla/5.0 (Linux; Android 13; Pixel 7)')); // expect android
console.log(detectDeviceOS('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')); // expect ios
console.log(detectDeviceOS('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')); // expect ios
console.log(detectDeviceOS('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')); // expect other
"
```

Expected output:
```
android
ios
ios
other
```

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/src/hooks/useDeviceOS.ts
git commit -m "feat(dashboard): add useDeviceOS hook"
```

---

### Task 2: i18n keys

**Files:**
- Modify: `apps/dashboard/src/messages/fa.json` (insert new `Install` top-level key)
- Modify: `apps/dashboard/src/messages/en.json` (insert new `Install` top-level key)
- Modify: `apps/dashboard/src/messages/fa/Console.json` (add `installApp` under `Console.Sidebar`)
- Modify: `apps/dashboard/src/messages/en/Console.json` (add `installApp` under `Console.Sidebar`)

**Interfaces:**
- Produces: translation keys consumed in Task 3 (`useTranslations('Install')` → `title`, `description`, `android_title`, `android_cafebazaar`, `android_googleplay`, `ios_title`, `ios_step1`, `ios_step2`, `ios_step3`) and Task 4 (`useTranslations('Console.Sidebar')` → `installApp`).

- [ ] **Step 1: Add the `Install` namespace to `fa.json`**

Find the existing `"Support": { ... }` block (ends right before `"Permissions": {`) and insert a new `"Install"` block immediately after it:

```json
  "Support": {
    "title": "مرکز پشتیبانی بفروش",
    "description": "اگه سوالی داری، سریع‌ترین راه ارتباط با ما تلگرامه 👇",
    "learn_center1": "ویدئوهای آموزش بفروش رو توی بخش «راهنما و آموزش» گذاشتیم",
    "learn_center2": "اگه جواب رو پیدا نکردید، تیم پشتیبانی کنار شماست",
    "telegram_main_button": "شروع چت در تلگرام",
    "telegram_channel": "کانال تلگرام",
    "whatsapp": "واتساپ",
    "whatsapp_des": "اگه تلگرام نداری، از واتس‌اپ پیام بده",
    "whatsapp_des2": "شروع چت»",
    "phone": "ارتباط تلفنی",
    "phone_des": "اگه دسترسی به تلگرام و واتس اپ نداری شنبه تا چهارشنبه، از ۹ تا ۱۷ پاسخگو هستیم",
    "instagram": "اینستاگرام",
    "telegram": "تلگرام",
    "enter_panel": "بازگشت به پنل"
  },
  "Install": {
    "title": "نصب اپلیکیشن بفروش",
    "description": "برای دسترسی سریع‌تر، اپلیکیشن بفروش رو روی گوشیت نصب کن",
    "android_title": "دانلود برای اندروید",
    "android_cafebazaar": "کافه بازار",
    "android_googleplay": "گوگل پلی",
    "ios_title": "نصب روی آیفون (از طریق سافاری)",
    "ios_step1": "روی آیکون Share (اشتراک‌گذاری) در نوار سافاری بزنید",
    "ios_step2": "گزینه «Add to Home Screen» را انتخاب کنید",
    "ios_step3": "روی «Add» بزنید تا آیکون بفروش به صفحه اصلی گوشی شما اضافه شود"
  },
  "Permissions": {
```

(This is a direct search-and-replace: match the `"Support": { ... }, \n "Permissions": {` region shown above in the real file and replace it with the same `Support` block followed by the new `Install` block followed by `"Permissions": {`.)

- [ ] **Step 2: Add the `Install` namespace to `en.json`**

Find the existing `"Support": { ... }` block in `en.json` (ends right before `"Permissions": {`) and insert the English equivalent:

```json
  "Support": {
    "title": "Support",
    "description": "Get in touch with us",
    "telegram_main_button": "Telegram Support",
    "telegram_channel": "Telegram Channel",
    "whatsapp": "WhatsApp",
    "phone": "Phone",
    "email": "Email",
    "telegram": "Telegram",
    "enter_panel": "Enter Panel"
  },
  "Install": {
    "title": "Install the Befroosh App",
    "description": "Install the Befroosh app on your phone for faster access",
    "android_title": "Download for Android",
    "android_cafebazaar": "Cafe Bazaar",
    "android_googleplay": "Google Play",
    "ios_title": "Install on iPhone (via Safari)",
    "ios_step1": "Tap the Share icon in Safari's toolbar",
    "ios_step2": "Choose \"Add to Home Screen\"",
    "ios_step3": "Tap \"Add\" — the Befroosh icon is added to your home screen"
  },
  "Permissions": {
```

- [ ] **Step 3: Add the sidebar key to `fa/Console.json`**

Inside `Console.Sidebar`, add `"installApp": "نصب اپلیکیشن",` next to the existing `"instagramConnections"` key (alphabetical-ish grouping isn't strict in this file, so simplest: add right after `"instagramConnections"`):

```json
    "instagramConnections": "ارتباط در اینستاگرام",
    "installApp": "نصب اپلیکیشن",
    "logout": "خروج",
```

- [ ] **Step 4: Add the sidebar key to `en/Console.json`**

```json
    "instagramConnections": "Instagram Connections",
    "installApp": "Install App",
    "logout": "Logout",
```

- [ ] **Step 5: Validate all four JSON files still parse**

```bash
cd apps/dashboard && node -e "
['src/messages/fa.json','src/messages/en.json','src/messages/fa/Console.json','src/messages/en/Console.json'].forEach(f => {
  JSON.parse(require('fs').readFileSync(f, 'utf8'));
  console.log(f, 'OK');
});
"
```

Expected output: all four lines end with `OK` (a `SyntaxError` means a comma/bracket mistake — fix before continuing).

- [ ] **Step 6: Commit**

```bash
git add apps/dashboard/src/messages/fa.json apps/dashboard/src/messages/en.json apps/dashboard/src/messages/fa/Console.json apps/dashboard/src/messages/en/Console.json
git commit -m "feat(dashboard): add i18n keys for install section"
```

---

### Task 3: `/install` page

**Files:**
- Create: `apps/dashboard/src/app/(Console)/install/page.tsx`

**Interfaces:**
- Consumes: `useDeviceOS` and `DeviceOS` from `@/hooks/useDeviceOS` (Task 1); translation keys from the `Install` namespace (Task 2); `Button`, `Card`, `CardContent` from `@/components/ui`.
- Produces: default-exported `InstallPage` component rendered at route `/install`.

- [ ] **Step 1: Write the page**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import {
  AndroidLogoIcon,
  AppleLogoIcon,
  CheckCircleIcon,
  ExportIcon,
  PlusSquareIcon,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { Button, Card, CardContent } from '@/components/ui';
import { useDeviceOS } from '@/hooks/useDeviceOS';

const CAFEBAZAAR_URL = 'https://cafebazaar.ir/app/app.befroosh';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=app.befrooshm&pli=1';

export default function InstallPage() {
  const t = useTranslations('Install');
  const os = useDeviceOS();

  const showAndroid = os === 'android' || os === 'other';
  const showIos = os === 'ios' || os === 'other';

  return (
    <div className="_install-page flex h-full flex-col overflow-y-auto bg-white px-6 pt-7 md:p-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('description')}</p>
        </div>

        {showAndroid && (
          <Card className="border-0 shadow-sm" data-testid="install-android-card">
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex items-center gap-2 text-gray-800">
                <AndroidLogoIcon size={24} weight="duotone" className="text-green-600" />
                <span className="font-semibold">{t('android_title')}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-14 w-full gap-2 rounded-xl text-base font-medium"
                >
                  <Link href={CAFEBAZAAR_URL} target="_blank" rel="noopener noreferrer">
                    {t('android_cafebazaar')}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-14 w-full gap-2 rounded-xl text-base font-medium"
                >
                  <Link href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer">
                    {t('android_googleplay')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showIos && (
          <Card className="border-0 shadow-sm" data-testid="install-ios-card">
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex items-center gap-2 text-gray-800">
                <AppleLogoIcon size={24} weight="duotone" className="text-gray-700" />
                <span className="font-semibold">{t('ios_title')}</span>
              </div>
              <ol className="flex flex-col gap-3">
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <ExportIcon size={20} className="shrink-0 text-blue-500" />
                  {t('ios_step1')}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <PlusSquareIcon size={20} className="shrink-0 text-blue-500" />
                  {t('ios_step2')}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircleIcon size={20} className="shrink-0 text-green-600" />
                  {t('ios_step3')}
                </li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint the new file**

```bash
cd apps/dashboard && npx tsc --noEmit
```

Expected: no new errors attributable to `src/app/(Console)/install/page.tsx` or `src/hooks/useDeviceOS.ts` (pre-existing baseline errors elsewhere in the app are expected and unrelated — see CLAUDE.md/`project_admin_frontend_tsc` convention of an app-wide pre-existing baseline).

```bash
npx eslint src/app/\(Console\)/install/page.tsx src/hooks/useDeviceOS.ts
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/dashboard/src/app/(Console)/install/page.tsx"
git commit -m "feat(dashboard): add /install page"
```

---

### Task 4: Sidebar entry

**Files:**
- Modify: `apps/dashboard/src/components/Layout/ConsoleSidebar.tsx`

**Interfaces:**
- Consumes: existing `generateData()` nav item shape `{ title, url, icon, isActive }`.
- Produces: a new nav item pointing to `/install`.

- [ ] **Step 1: Add the `DownloadSimpleIcon` import**

In `ConsoleSidebar.tsx`, extend the existing `@phosphor-icons/react/dist/ssr` import:

```ts
import {
  AddressBookIcon,
  BriefcaseIcon,
  CubeIcon,
  DownloadSimpleIcon,
  GraduationCap,
  HouseIcon,
  InstagramLogoIcon,
  LifebuoyIcon,
  LightningIcon,
  ShoppingBagIcon,
  SlidersIcon,
} from '@phosphor-icons/react/dist/ssr';
```

- [ ] **Step 2: Add the nav item**

In `generateData()`'s `navMain` array, insert the new item right after the `settings` entry and before the commented-out block / `learn` entry:

```js
    {
      title: t('settings'),
      url: '/settings',
      icon: SlidersIcon,
      isActive: true,
    },
    {
      title: t('installApp'),
      url: '/install',
      icon: DownloadSimpleIcon,
      isActive: true,
    },
    {
      title: t('learn'),
      url: '/help/learn',
      icon: GraduationCap,
      isActive: true,
    },
```

- [ ] **Step 3: Typecheck and lint**

```bash
cd apps/dashboard && npx tsc --noEmit && npx eslint src/components/Layout/ConsoleSidebar.tsx
```

Expected: no new errors, 0 lint errors.

- [ ] **Step 4: Commit**

```bash
git add apps/dashboard/src/components/Layout/ConsoleSidebar.tsx
git commit -m "feat(dashboard): add install-app sidebar link"
```

---

### Task 5: E2E test

**Files:**
- Create: `apps/dashboard/e2e/tests/install/install.spec.ts`

**Interfaces:**
- Consumes: `testWithAuth` fixture from `../../fixtures/auth.fixture` and `expect` from `../../fixtures/test.fixture` (same pattern as `e2e/tests/settings/pagePromotion.spec.ts`); `data-testid="install-android-card"` / `data-testid="install-ios-card"` added in Task 3.

- [ ] **Step 1: Write the test**

```ts
import { testWithAuth } from '../../fixtures/auth.fixture';
import { expect } from '../../fixtures/test.fixture';

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

testWithAuth.describe('Install page', () => {
  testWithAuth.describe('on an Android user agent', () => {
    testWithAuth.use({ userAgent: ANDROID_UA });

    testWithAuth('shows only the Android install card', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/install');
      await expect(authenticatedPage.getByTestId('install-android-card')).toBeVisible();
      await expect(authenticatedPage.getByTestId('install-ios-card')).toHaveCount(0);
    });
  });

  testWithAuth.describe('on an iOS user agent', () => {
    testWithAuth.use({ userAgent: IOS_UA });

    testWithAuth('shows only the iOS install card', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/install');
      await expect(authenticatedPage.getByTestId('install-ios-card')).toBeVisible();
      await expect(authenticatedPage.getByTestId('install-android-card')).toHaveCount(0);
    });
  });

  testWithAuth.describe('on a desktop user agent', () => {
    testWithAuth.use({ userAgent: DESKTOP_UA });

    testWithAuth('shows both install cards', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/install');
      await expect(authenticatedPage.getByTestId('install-android-card')).toBeVisible();
      await expect(authenticatedPage.getByTestId('install-ios-card')).toBeVisible();
    });
  });

  testWithAuth('sidebar link navigates to /install', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.getByRole('link', { name: 'نصب اپلیکیشن' }).click();
    await authenticatedPage.waitForURL('**/install');
  });
});
```

- [ ] **Step 2: Run the test**

This suite requires the same local stack (backend + Redis reachable, `testMobile`/OTP retrieval via `apiHelper`) as every other spec under `e2e/tests/` — it is not a new requirement introduced by this feature. Run it exactly like the existing suite:

```bash
cd apps/dashboard && npx playwright test e2e/tests/install/install.spec.ts
```

Expected: all 4 tests pass. If the local backend/Redis isn't running, this fails the same way every other e2e spec in this repo would — start the stack first (see this repo's e2e setup docs), not a problem specific to this test.

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/e2e/tests/install/install.spec.ts
git commit -m "test(dashboard): add e2e coverage for /install page"
```

---

### Task 6: Knowledge docs

**Files:**
- Create: `Front/knowledge/updates/2026-07-13-installSection.update.md`
- Modify: `Front/knowledge/knowledgeMap.doc.md`

**Interfaces:** None (documentation only).

- [ ] **Step 1: Write the update doc**

Create `knowledge/updates/2026-07-13-installSection.update.md` (note: this path is relative to the `Front/` repo root, i.e. `Front/worktrees/install-section/knowledge/updates/...` inside this worktree):

```markdown
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
```

- [ ] **Step 2: Add the row to `knowledgeMap.doc.md`**

Append a new row to the table in `Front/knowledge/knowledgeMap.doc.md` (after the most recent `updates/*.md` row):

```markdown
| `2026-07-13-installSection.update.md` | `Front/knowledge/updates/2026-07-13-installSection.update.md` | Summary of the new `/install` page (Android store links / iOS PWA-install steps by device) and its sidebar entry. |
```

- [ ] **Step 3: Commit**

```bash
git add knowledge/updates/2026-07-13-installSection.update.md knowledge/knowledgeMap.doc.md
git commit -m "docs: add install-section update summary"
```

---

## Final check

- [ ] **Run the full typecheck, lint, and e2e suite for the touched spec one more time from `apps/dashboard`:**

```bash
cd apps/dashboard && npx tsc --noEmit && npx eslint src/app/\(Console\)/install/page.tsx src/hooks/useDeviceOS.ts src/components/Layout/ConsoleSidebar.tsx && npx playwright test e2e/tests/install/install.spec.ts
```

Expected: no new tsc errors, 0 lint errors, 4/4 e2e tests pass.
