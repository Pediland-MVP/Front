# Automation Draft `fileTemp` Crash on `/automations/add` — 2026-08-28

Reference docs: this file is the full reference. Related: the local-draft feature itself
(`apps/dashboard/src/utils/automationDraft.ts`, `AutomationDraftWatcher.tsx`,
`AutomationDraftBanner.tsx`).

Sentry: `MY-41` — `TypeError: Cannot read properties of undefined (reading 'split')`,
`/automations/add`, production, 375 events / 94 users, first seen 2026-08-17.

## Problem

`/automations/add` blew up for anyone whose saved local draft contained a picked-but-not-yet-
uploaded file. The whole page died — this is a render-time throw, not a toast.

The chain:

1. `AutomationDraftWatcher` debounce-persists the live form to `localStorage` via
   `writeAutomationDraft` → `JSON.stringify`.
2. A content item created by dropping **more than one** file at once carries
   `contents[i].fileTemp = { file: <File>, id }` (`MediaUploader.onDrop` appends files 2..n
   through `appendContents`).
3. A `File` has **no enumerable own properties and no `toJSON`**, so `JSON.stringify(file)`
   produces `{}`. The stored draft keeps a `fileTemp` that still *looks* right — `{ file: {}, id }`
   — but has lost `type`, `size` and `name`. The schema does not catch it: `fileTemp: z.any()`.
4. On return to `/automations/add`, `AutomationForm` restores that draft, `MediaUploader`'s
   init effect does `setFiles([content.fileTemp])`, and `renderPreview` ran:

   ```ts
   const isUploaded = 'url' in file;                 // false — it's a "new" file
   const { file: uploadedFile } = file as FileWithPreview;   // {}
   const fileType = isUploaded ? file.mimeType?.split('/')[0]
                               : uploadedFile.type.split('/')[0];   // 💥 undefined.split
   ```

Confirmed against the deployed bundle rather than guessed: the innermost production frame
`b85d778530f914da.js:2:81546` lands exactly on `a.type.split("/")` inside that ternary, its
callers being the `files.map(...)` and the `renderPreview(...)` call in the same component.
(The frames above it are all React DOM's work loop — the error was caught by an error
boundary, hence `handled: yes`.)

Two smaller defects hid behind the same bad entry: `getDisplaySize` rendered a literal
`NaN MB`, and `isUploading` returned `true` forever (no `process`, no `isUploading`), which
**hides the row's own delete button** — so the user could not even remove the dead entry.

## Solution

Fixed at both ends: stop writing what cannot be restored, and stop trusting the shape at render.

1. **`apps/dashboard/src/utils/automationDraft.ts` — never persist `fileTemp`.**
   New `stripFileTemp()` drops `fileTemp` from every `contents[]` and `reminders[]` entry.
   Applied on **write** (new drafts never carry it) *and* on **read** — the read side matters,
   because ~2 days' worth of already-poisoned drafts are sitting in real users' browsers and a
   write-only fix would not reach them until they happened to overwrite. The content item
   itself is kept; only its unrestorable pending file goes, so the user just re-picks it.
   Already-uploaded files (`contents[].file` = `{ id, url, mimeType }`) are plain JSON and are
   untouched.

2. **`packages/ui/src/components/ui-custom/MediaUploader.tsx` — one guard, one source of truth.**
   New `getFileBlob(file)` returns the real `File` only when `file.file instanceof Blob`, which
   a JSON-revived `{}` never is. `renderPreview`, `getDisplayName`, `getDisplaySize`,
   `getProgressText` and `isUploading` all read through it, so a file-shaped entry with no blob
   degrades to the generic file icon, no size text, no progress, and — importantly — **not**
   "uploading", so its delete button stays available.
   `renderPreview` was also restructured so the `image` branch can fall through to the default
   icon instead of reaching `URL.createObjectURL` with a non-`Blob`.

`fileTemp: z.any()` in `ContentItemSchema` is deliberately left as is — the field genuinely
holds a live `File` in memory; the bug was persisting it, not typing it.

## Changes

| File | Change |
| --- | --- |
| `apps/dashboard/src/utils/automationDraft.ts` | `stripFileTemp()`; applied in `writeAutomationDraft` and `readAutomationDraft` |
| `apps/dashboard/src/utils/automationDraft.test.ts` | +4 tests: write-side strip asserted against **raw** `localStorage`, read-side strip of an already-stored bad draft, uploaded `file` left alone |
| `packages/ui/src/components/ui-custom/MediaUploader.tsx` | `getFileBlob()`; `renderPreview`/`getDisplayName`/`getDisplaySize`/`getProgressText`/`isUploading` routed through it |
| `packages/ui/src/components/ui-custom/__tests__/MediaUploader.test.tsx` | **new** — 5 tests, incl. the exact regression (a JSON round-tripped `File`) |

No i18n keys, no API change, no backend change. Frontend-only, safe to ship alone.

## Verification

- New `MediaUploader.test.tsx` watched **red first**: it reproduced the production message
  verbatim — `TypeError: Cannot read properties of undefined (reading 'split')` at
  `MediaUploader.tsx:171` — then green after the fix. 5/5 pass.
- `automationDraft.test.ts` 15/15 pass (4 new).
- Neighbouring suites green: `packages/ui` 156 tests / 16 files (`automation-builder` +
  `ui-custom`), dashboard `src/components/Automations` + draft utils 50 tests / 11 files.
- `apps/dashboard` `tsc --noEmit` diffed against `main`: **no new errors** from these files.
  (`MediaUploader.tsx` `next/image` TS2307 is pre-existing on `main` — `packages/ui` has no
  `next` dependency.)
- `eslint` on all four files: 0 errors; the 4 warnings are pre-existing.
