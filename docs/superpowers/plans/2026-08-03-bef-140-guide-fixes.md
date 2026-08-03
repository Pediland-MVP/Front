# BEF-140 Guide (راهنما) Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the dashboard's in-app guide/help dialog (`HelpMeDialog`) per Linear BEF-140: move its close control to a top X icon, stop it auto-fullscreening video on iPhone, add missing guide affordances (per content type, and for the "automated message name" field), fix the misplaced "start request message" guide, and register every newly-added guide location in the Admin guide-management dropdown. Slow video playback (BEF-140's item 2) is explicitly OUT of scope per user instruction.

**Architecture:** `HelpMeDialog` (`apps/dashboard/src/components/Global/HelpMeDialog.tsx`) is a dashboard-only component. The shared `AutomationBuilder` package (`packages/ui/src/automation-builder/`) is app-agnostic and never imports it directly — instead it exposes typed "slot" props (`helpSlots`, and a new `contentTypeHelpSlots`) that the dashboard fills with real `<HelpMeDialog helpId="...">` instances. Every *new* guide added in this plan is wired through `helpId` (fetched dynamically from the Admin-managed `/guides/:helpId` CMS via `HelpMeDialog`'s existing `useSWR` call) — no new hardcoded video URLs are added to `wizardVideoLinks.conf.ts`, per explicit instruction not to touch the existing hardcoded-URL guides.

**Tech Stack:** Next.js (dashboard, admin apps), React, react-hook-form, next-intl, SWR, Vitest + Testing Library, Tailwind, Radix UI (`@radix-ui/react-dialog`), lucide-react icons.

## Global Constraints

- Do NOT modify `apps/dashboard/src/components/Automations/wizardVideoLinks.conf.ts` or any existing hardcoded `videoSrc`/`WizardVideoLinks.*` reference — those are the "existing hardcoded url guides" the user said not to touch.
- Every brand-new guide location added in this plan must get a `helpId` and rely purely on the dynamic `/guides/:helpId` CMS fetch (no hardcoded `videoSrc` passed for new instances) — and must get a matching `SelectItem` in the Admin guides dropdown (`apps/admin/src/app/(main)/guides/guides-table.tsx`) so an admin can attach content/video to it.
- Skip BEF-140 item 2 ("پخش ویدئو خیلی کند هست" / slow video playback) entirely — explicitly excluded by the user.
- All new user-facing Persian text goes in `apps/dashboard/src/messages/fa.json` only (not `en.json` — per CLAUDE.md §8, English is translated later). The Admin guides dropdown labels are plain inline Persian strings, matching that file's existing (non-i18n) convention for this dropdown — do not introduce next-intl there, that would be an unrelated convention change.
- Do not touch `apps/dashboard/src/components/Automations/Form/Contents/ContentItem.tsx` (the old, unused, unimported duplicate outside `packages/ui`) — dead code, out of scope.
- Run only the specific test files touched by this plan (`Contents.test.tsx`, `AutomationBuilder.test.tsx`, the new `HelpMeDialog.test.tsx`), not the whole test suite, per CLAUDE.md §7.
- Every commit stays inside `Front/worktrees/bef-140-guide-fixes` on branch `fix/bef-140-guide-fixes` — never touch the main `Front/` checkout.

---

## File Map

| File | Change |
|---|---|
| `apps/dashboard/src/components/Global/HelpMeDialog.tsx` | Close button → top-right `X` (was bottom "بستن" button); add `playsInline` to the `<video>`; make `videoSrc` optional |
| `apps/dashboard/src/components/Global/__tests__/HelpMeDialog.test.tsx` | **New** — regression coverage for the two fixes above |
| `packages/ui/src/automation-builder/Form/TitleAndEnabled.tsx` | Add `helpSlot` prop, render next to the title label |
| `packages/ui/src/automation-builder/AutomationBuilder.types.ts` | Add `'titleAndEnabled'` to `AutomationBuilderHelpSlotKey`; add `contentTypeHelpSlots` prop |
| `packages/ui/src/automation-builder/AutomationBuilder.tsx` | Wire `helpSlots.titleAndEnabled` and `contentTypeHelpSlots` through |
| `packages/ui/src/automation-builder/__tests__/AutomationBuilder.test.tsx` | Add coverage for `helpSlots.titleAndEnabled` |
| `packages/ui/src/automation-builder/Contents/Contents.tsx` | Add `contentTypeHelpSlots` prop, pass per-item slot to `ContentItem` |
| `packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx` | Add coverage for `contentTypeHelpSlots` |
| `packages/ui/src/automation-builder/Contents/ContentItem.tsx` | Add `helpSlot` prop, render next to the content-type label |
| `apps/dashboard/src/components/Automations/AutomationForm.tsx` | Fix misplaced `commentTrigger` guide (`noAbsolute`); add `titleAndEnabled` and `contentTypeHelpSlots` instances |
| `apps/dashboard/src/messages/fa.json` | Add `Automations.TitleAndEnabled.Help.{title,description}` |
| `apps/admin/src/app/(main)/guides/guides-table.tsx` | Add `SelectItem`s for `automation_title` + 10 `automation_content_<type>` help IDs |

---

### Task 1: `HelpMeDialog` — top X close button, iPhone `playsInline` fix, optional `videoSrc`

**Files:**
- Modify: `apps/dashboard/src/components/Global/HelpMeDialog.tsx`
- Test: `apps/dashboard/src/components/Global/__tests__/HelpMeDialog.test.tsx` (new)

**Interfaces:**
- Produces: `HelpDialogProps.videoSrc` becomes `videoSrc?: string` (was required `string`) — every later task that renders a brand-new `<HelpMeDialog>` instance (Tasks 5) relies on being able to omit `videoSrc` entirely.

- [ ] **Step 1: Write the failing test**

Create `apps/dashboard/src/components/Global/__tests__/HelpMeDialog.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpMeDialog } from '../HelpMeDialog';

const translate = (key: string) => key;
vi.mock('next-intl', () => ({
  useTranslations: () => translate,
}));

// HelpMeDialog fetches `/guides/:helpId` via SWR whenever `helpId` is passed. None of
// these tests pass `helpId`, so `useSWR`'s key is `null` and it never fetches — no mock
// needed for `fetcher`/`swr` itself.

describe('HelpMeDialog', () => {
  it('opens the dialog, shows a top close (X) button, and no longer shows a bottom "بستن" button', () => {
    render(<HelpMeDialog title="عنوان راهنما" videoSrc="https://example.com/v.mp4" />);

    fireEvent.click(screen.getByText('(راهنما)'));

    expect(screen.getByText('عنوان راهنما')).toBeInTheDocument();
    // The old bottom close button is gone.
    expect(screen.queryByText('بستن')).not.toBeInTheDocument();
    // A close control is present (Radix DialogClose renders a real button).
    expect(screen.getByRole('button', { name: 'بستن' })).toBeInTheDocument();
  });

  it('closes the dialog when the top close (X) button is clicked', () => {
    render(<HelpMeDialog title="عنوان راهنما" videoSrc="https://example.com/v.mp4" />);

    fireEvent.click(screen.getByText('(راهنما)'));
    expect(screen.getByText('عنوان راهنما')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'بستن' }));
    expect(screen.queryByText('عنوان راهنما')).not.toBeInTheDocument();
  });

  it('renders the video with playsInline so iOS Safari does not auto-fullscreen it', () => {
    render(<HelpMeDialog title="عنوان راهنما" videoSrc="https://example.com/v.mp4" />);

    fireEvent.click(screen.getByText('(راهنما)'));

    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('playsinline');
  });

  it('renders with no videoSrc at all (a brand-new, CMS-only guide with nothing hardcoded)', () => {
    render(<HelpMeDialog title="راهنمای جدید" />);

    fireEvent.click(screen.getByText('(راهنما)'));

    expect(screen.getByText('راهنمای جدید')).toBeInTheDocument();
    expect(document.querySelector('video')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/dashboard && npx vitest run src/components/Global/__tests__/HelpMeDialog.test.tsx`
Expected: FAIL — no `role=button name="بستن"` exists yet (only the bottom `<Button>` text, which isn't reachable via `getByText` after a `queryByText('بستن')` check conflict, and no `playsinline` attribute on the `<video>`).

- [ ] **Step 3: Implement the fix**

In `apps/dashboard/src/components/Global/HelpMeDialog.tsx`:

Replace the import block (lines 11-20):

```tsx
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
```

Change `HelpDialogProps.videoSrc` (line 41) from:

```tsx
  videoSrc: string;
```

to:

```tsx
  videoSrc?: string;
```

In `AutoAspectPlayer`, add `playsInline` to the `<video>` element (lines 110-117):

```tsx
      <video
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
        onLoadedMetadata={handleLoadedMetadata}
      />
```

Replace the custom header block (lines 259-270) to add the top-right `X` close button — note the existing `pl-6` on the title column already reserves this exact space:

```tsx
        <div className="relative flex items-start justify-between rounded-t-2xl border-b border-slate-100 bg-slate-50/50 p-5 md:p-6">
          <div className="flex flex-col gap-1 pl-6 text-right">
            <DialogTitle className="flex items-center justify-start gap-2 text-base font-black text-slate-800">
              <MonitorPlayIcon size={22} className="text-blue-600" /> {resolvedTitle}
            </DialogTitle>
            {resolvedDescription && (
              <DialogDescription className="mt-0.5 text-right text-xs leading-relaxed font-medium text-slate-400">
                {resolvedDescription}
              </DialogDescription>
            )}
          </div>
          <DialogClose
            aria-label={t('close') || 'بستن'}
            className="absolute top-4 left-4 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 md:top-5 md:left-5"
          >
            <X size={18} />
          </DialogClose>
        </div>
```

Remove the "Custom Footer" block entirely (lines 286-291, the `DialogFooter`/bottom "بستن" `Button`) — the close affordance now lives only in the top `X`:

```tsx
        {/* Custom Footer */}
        <DialogFooter className="flex justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/50 p-4">
          <Button onClick={() => setOpen(false)} className="w-[120px] font-bold">
            {t('close') || 'بستن'}
          </Button>
        </DialogFooter>
```

(Delete that whole block — nothing replaces it; `DialogContent`'s closing tag now directly follows the content body `</div>`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/dashboard && npx vitest run src/components/Global/__tests__/HelpMeDialog.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/src/components/Global/HelpMeDialog.tsx apps/dashboard/src/components/Global/__tests__/HelpMeDialog.test.tsx
git commit -m "fix(dashboard): move guide dialog close button to top X, prevent iOS auto-fullscreen"
```

---

### Task 2: `TitleAndEnabled` — accept a `helpSlot`

**Files:**
- Modify: `packages/ui/src/automation-builder/Form/TitleAndEnabled.tsx`
- Modify: `apps/dashboard/src/messages/fa.json`

**Interfaces:**
- Consumes: nothing new.
- Produces: `TitleAndEnabledProps.helpSlot?: React.ReactNode`, rendered next to the title field's label — consumed by Task 3 (`AutomationBuilder.tsx` passes `helpSlots?.titleAndEnabled` into it) and Task 5 (dashboard supplies the actual `<HelpMeDialog>`).

- [ ] **Step 1: Implement**

In `packages/ui/src/automation-builder/Form/TitleAndEnabled.tsx`, replace the whole file:

```tsx
'use client';

import { AutomationFormType } from '../schemas/automationForm';
import { useTranslations } from 'next-intl';
import { Control } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, Input, Switch } from '@/components/ui';

type TitleAndEnabledProps = {
  control: Control<AutomationFormType>;
  /** Rendered next to the title-field label. Replaces the dashboard-only `HelpMeDialog`
   * that used to be hardcoded here (or, before this fix, was entirely missing). */
  helpSlot?: React.ReactNode;
};

export const TitleAndEnabled = ({ control, helpSlot }: TitleAndEnabledProps) => {
  const t = useTranslations('Automations.TitleAndEnabled');

  return (
    <div className="_title-and-enabled space-y-4">
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-1">
              <FormLabel>{t('title_label')}</FormLabel>
              {helpSlot}
            </div>
            <FormControl>
              <Input placeholder={t('title_placeholder')} {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="enabled"
        render={({ field }) => (
          <FormItem className="flex items-center gap-x-2">
            <FormControl>
              <Switch type="button" checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="mt-0">{t('enabled_label')}</FormLabel>
          </FormItem>
        )}
      />
    </div>
  );
};
```

In `apps/dashboard/src/messages/fa.json`, find the `Automations.TitleAndEnabled` object:

```json
    "TitleAndEnabled": {
      "title_label": "نام پیام خودکار (اختیاری)",
      "title_placeholder": "مثلاً: ارسال قیمت محصولات تابستانی",
      "enabled_label": "فعال"
    },
```

Replace with (adds a nested `Help` object, matching the `CommentConsent.Help` pattern elsewhere in the same file):

```json
    "TitleAndEnabled": {
      "title_label": "نام پیام خودکار (اختیاری)",
      "title_placeholder": "مثلاً: ارسال قیمت محصولات تابستانی",
      "enabled_label": "فعال",
      "Help": {
        "title": "نام پیام خودکار",
        "description": "به این پیام خودکار یک نام اختصاصی بدهید تا بعداً راحت‌تر آن را در لیست اتوماسیون‌ها پیدا کنید. این نام فقط برای خودتان نمایش داده می‌شود."
      }
    },
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/automation-builder/Form/TitleAndEnabled.tsx apps/dashboard/src/messages/fa.json
git commit -m "feat(automation-builder): let TitleAndEnabled accept a helpSlot"
```

---

### Task 3: `AutomationBuilder` — new slot keys (`titleAndEnabled`, `contentTypeHelpSlots`)

**Files:**
- Modify: `packages/ui/src/automation-builder/AutomationBuilder.types.ts`
- Modify: `packages/ui/src/automation-builder/AutomationBuilder.tsx`
- Test: `packages/ui/src/automation-builder/__tests__/AutomationBuilder.test.tsx`

**Interfaces:**
- Consumes: `TitleAndEnabledProps.helpSlot` (Task 2), `ContentsProps.contentTypeHelpSlots` (Task 4, defined here first as the prop the wiring passes through).
- Produces: `AutomationBuilderHelpSlotKey` now includes `'titleAndEnabled'`. `AutomationBuilderProps.contentTypeHelpSlots?: Partial<Record<AutomationContentTypesEnum, React.ReactNode>>` — consumed by Task 5 (dashboard builds and passes this map).

- [ ] **Step 1: Write the failing test**

Add to `packages/ui/src/automation-builder/__tests__/AutomationBuilder.test.tsx`, inside the existing `describe('AutomationBuilder (shared, mode=template)', ...)` block, as a new `it` (place it after the last existing test, before the closing `});` of the `describe`):

```tsx
  it('renders helpSlots.titleAndEnabled next to the TitleAndEnabled title field (mode=automation only)', () => {
    render(
      <AutomationBuilder
        mode="automation"
        apiClient={{ upload: vi.fn(), get: vi.fn().mockResolvedValue({ data: {} }) }}
        initialValue={validInitialValue}
        onSubmit={vi.fn()}
        submitLabel="ذخیره"
        cancelLabel="انصراف"
        helpSlots={{ titleAndEnabled: <span data-testid="title-help-slot">?</span> }}
      />,
    );
    expect(screen.getByTestId('title-help-slot')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/ui && npx vitest run src/automation-builder/__tests__/AutomationBuilder.test.tsx`
Expected: FAIL — `helpSlots` has no `titleAndEnabled` key yet (TS error at build/type-check, and even if loosely typed, `TitleAndEnabled` doesn't render it), so `getByTestId('title-help-slot')` finds nothing.

- [ ] **Step 3: Implement**

In `packages/ui/src/automation-builder/AutomationBuilder.types.ts`, add an import at the top (after the existing imports, line 3):

```ts
import type { AutomationContentTypesEnum } from './constants/automationContent.enum';
```

Change the `AutomationBuilderHelpSlotKey` union (lines 16-21) from:

```ts
export type AutomationBuilderHelpSlotKey =
  | 'triggers'
  | 'conditions'
  | 'contents'
  | 'justFollowers'
  | 'commentTrigger';
```

to:

```ts
export type AutomationBuilderHelpSlotKey =
  | 'triggers'
  | 'conditions'
  | 'contents'
  | 'justFollowers'
  | 'commentTrigger'
  | 'titleAndEnabled';
```

Add a new prop to `AutomationBuilderProps`, right after the existing `helpSlots` prop (after line 48, `helpSlots?: Partial<Record<AutomationBuilderHelpSlotKey, React.ReactNode>>;`):

```ts
  /** Per-content-type help affordances, keyed by `AutomationContentTypesEnum` — rendered
   * next to each content item's own type label inside `ContentItem`'s header (e.g. next
   * to "storefront"/"button"/"text"). Separate from `helpSlots` because this is keyed by
   * content type, not by a single fixed section. */
  contentTypeHelpSlots?: Partial<Record<AutomationContentTypesEnum, React.ReactNode>>;
```

In `packages/ui/src/automation-builder/AutomationBuilder.tsx`, add `contentTypeHelpSlots` to the destructured props (line 30, right after `helpSlots,`):

```tsx
  helpSlots,
  contentTypeHelpSlots,
```

Change the `TitleAndEnabled` render (line 127) from:

```tsx
            <TitleAndEnabled control={form.control} />
```

to:

```tsx
            <TitleAndEnabled control={form.control} helpSlot={helpSlots?.titleAndEnabled} />
```

Change the `Contents` render (lines 101-108) to also pass `contentTypeHelpSlots` through:

```tsx
          <Contents
            mode={AutomationContentModeEnum.AUTOMATION}
            apiClient={apiClient}
            isPromotion={isPromotion}
            helpSlot={helpSlots?.contents}
            builderMode={mode}
            commentTriggerHelpSlot={helpSlots?.commentTrigger}
            contentTypeHelpSlots={contentTypeHelpSlots}
          />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/ui && npx vitest run src/automation-builder/__tests__/AutomationBuilder.test.tsx`
Expected: PASS (all tests, including the new one)

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/automation-builder/AutomationBuilder.types.ts packages/ui/src/automation-builder/AutomationBuilder.tsx packages/ui/src/automation-builder/__tests__/AutomationBuilder.test.tsx
git commit -m "feat(automation-builder): add titleAndEnabled help slot and contentTypeHelpSlots prop"
```

---

### Task 4: `Contents` / `ContentItem` — per-content-type help slot

**Files:**
- Modify: `packages/ui/src/automation-builder/Contents/Contents.tsx`
- Modify: `packages/ui/src/automation-builder/Contents/ContentItem.tsx`
- Test: `packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx`

**Interfaces:**
- Consumes: `AutomationBuilderProps.contentTypeHelpSlots` (Task 3) — passed in as `ContentsProps.contentTypeHelpSlots`.
- Produces: `ContentItemProps` (inline object type) gains `helpSlot?: React.ReactNode`, rendered inside the content item's header row next to its type label.

- [ ] **Step 1: Write the failing test**

Add to `packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx`. First, extend `Wrapper` (lines 53-75) to accept and forward `contentTypeHelpSlots`:

```tsx
function Wrapper({
  apiClient,
  builderMode,
  mode,
  initialContents,
  contentTypeHelpSlots,
}: {
  apiClient?: AutomationBuilderApiClient;
  builderMode?: AutomationBuilderMode;
  mode?: AutomationContentModeEnum;
  initialContents?: any[];
  contentTypeHelpSlots?: Partial<Record<AutomationContentTypesEnum, React.ReactNode>>;
}) {
  const form = useForm({ defaultValues: { contents: initialContents ?? [], reminders: [] } });
  return (
    <FormProvider {...form}>
      <Contents
        mode={mode ?? AutomationContentModeEnum.AUTOMATION}
        apiClient={apiClient ?? { upload: vi.fn(), get: vi.fn() }}
        helpSlot={<span data-testid="help-slot">help</span>}
        builderMode={builderMode}
        contentTypeHelpSlots={contentTypeHelpSlots}
      />
    </FormProvider>
  );
}
```

Then add a new test inside `describe('Contents (shared, mode=automation)', ...)`, after the existing two tests:

```tsx
  it('renders the matching contentTypeHelpSlots entry next to a content item, keyed by that item\'s type', () => {
    render(
      <Wrapper
        initialContents={[{ type: AutomationContentTypesEnum.TEXT }]}
        contentTypeHelpSlots={{
          [AutomationContentTypesEnum.TEXT]: <span data-testid="text-help-slot">?</span>,
          [AutomationContentTypesEnum.VITRIN]: <span data-testid="vitrin-help-slot">?</span>,
        }}
      />,
    );
    expect(screen.getByTestId('text-help-slot')).toBeInTheDocument();
    // Only the TEXT item is rendered, so the VITRIN-keyed slot must not appear.
    expect(screen.queryByTestId('vitrin-help-slot')).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/ui && npx vitest run src/automation-builder/Contents/__tests__/Contents.test.tsx`
Expected: FAIL — `contentTypeHelpSlots` isn't a `Contents` prop yet, nothing renders `text-help-slot`.

- [ ] **Step 3: Implement**

In `packages/ui/src/automation-builder/Contents/Contents.tsx`, add to `ContentsProps` (after the `commentTriggerHelpSlot` field, before the closing `};` around line 78):

```tsx
  /** Per-content-type help affordances, keyed by `AutomationContentTypesEnum`. Forwarded
   * to each `ContentItem` and rendered next to that item's own type label. */
  contentTypeHelpSlots?: Partial<Record<AutomationContentTypesEnum, React.ReactNode>>;
```

Add `contentTypeHelpSlots` to the destructured props of the `Contents` component (line 94, after `commentTriggerHelpSlot,`):

```tsx
  commentTriggerHelpSlot,
  contentTypeHelpSlots,
```

In the `.map((content, index) => ...)` block that renders `ContentItem` (lines 380-393), pass the matching slot down:

```tsx
                .map((content, index) => (
                  <ContentsUploaderContextProvider
                    defaultValue={content.file as UploadedFile}
                    key={content._xid}
                  >
                    <ContentItem
                      onContentDeleted={onContentDeleted}
                      mode={mode}
                      id={content._xid}
                      index={index}
                      appendContents={appendContents}
                      content={content as FieldArrayWithId<z.infer<typeof ContentItemSchema>>}
                      apiClient={apiClient}
                      helpSlot={contentTypeHelpSlots?.[content.type as AutomationContentTypesEnum]}
                    />
                  </ContentsUploaderContextProvider>
                ))}
```

In `packages/ui/src/automation-builder/Contents/ContentItem.tsx`, add `helpSlot` to the `ContentItem` component's inline props type (lines 99-109 — the object type in the function signature):

```tsx
export const ContentItem = ({
  id,
  index,
  mode,
  onContentDeleted,
  appendContents,
  content,
  apiClient,
  helpSlot,
}: {
  id: string;
  index: number;
  mode: AutomationContentModeEnum;
  isPromotion?: boolean;
  defaultUploaderValue?: UploadedFile | null;
  onContentDeleted: (index: number) => any;
  appendContents: UseFieldArrayAppend<z.infer<typeof ContentItemSchema>>;
  content: z.infer<typeof ContentItemSchema>;
  apiClient: AutomationBuilderApiClient;
  /** Rendered next to this item's type label in the header — the per-content-type guide
   * (e.g. for storefront/button/text) requested by BEF-140. */
  helpSlot?: React.ReactNode;
}) => {
```

Render it in the header, right after the type description text (lines 198-203):

```tsx
          <div className="text-secondary flex items-center gap-2 text-[13px] font-semibold">
            <div className="bg-secondary flex size-5.5 items-center justify-center rounded-full p-0 text-xs leading-px font-medium text-white">
              {index + 1}
            </div>
            {t_contentTypes(`buttons.descriptions.${typeKey}`)}
            {helpSlot}
          </div>
```

(This changes the container's className from `flex gap-2` to `flex items-center gap-2` — a harmless, purely visual vertical-centering addition now that a third inline element sits alongside the badge and text.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/ui && npx vitest run src/automation-builder/Contents/__tests__/Contents.test.tsx`
Expected: PASS (all tests, including the new one)

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/automation-builder/Contents/Contents.tsx packages/ui/src/automation-builder/Contents/ContentItem.tsx packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx
git commit -m "feat(automation-builder): render per-content-type help slot in ContentItem header"
```

---

### Task 5: Dashboard `AutomationForm.tsx` — wire it all up + fix the misplaced start-request guide

**Files:**
- Modify: `apps/dashboard/src/components/Automations/AutomationForm.tsx`

**Interfaces:**
- Consumes: `AutomationBuilderProps.helpSlots.titleAndEnabled` (Task 3), `AutomationBuilderProps.contentTypeHelpSlots` (Task 3/4), `HelpMeDialog`'s now-optional `videoSrc` (Task 1).

This task has no isolated unit test of its own — `AutomationForm.tsx`'s existing test files (`AutomationForm.test.tsx`, `AutomationForm.submit.test.tsx`, etc.) mount the full form; this task's correctness is verified by re-running those alongside a manual/visual check, per Step 3 below.

- [ ] **Step 1: Fix the misplaced "start request message" guide (BEF-140 item 6)**

In `apps/dashboard/src/components/Automations/AutomationForm.tsx`, the `commentTriggerHelpProps` object (lines 536-541) currently sets `position: 'left'`, which — because the `<HelpMeDialog>` instance at lines 588-590 doesn't pass `noAbsolute` — makes `HelpMeDialog` render its trigger as `absolute left-0 top-1/2 -translate-y-1/2` inside `StartAutomationMessage`'s `relative` header row. That overlaps the header's trash-delete button (which sits at the physical-left edge via `ms-auto` in the RTL layout) instead of appearing inline next to the "پیام درخواست شروع" label. Fix: drop `position` (no longer relevant once `noAbsolute` is set) and add `noAbsolute` on the instance itself, matching the pattern the `contents` slot already uses two lines below.

Change:

```tsx
  const commentTriggerHelpProps = {
    title: t('CommentConsent.Help.title'),
    description: t('CommentConsent.Help.description'),
    videoSrc: WizardVideoLinks.Automations.Hints.CommentConsent.video,
    position: 'left' as const,
  };
```

to:

```tsx
  const commentTriggerHelpProps = {
    title: t('CommentConsent.Help.title'),
    description: t('CommentConsent.Help.description'),
    videoSrc: WizardVideoLinks.Automations.Hints.CommentConsent.video,
  };
```

And change:

```tsx
            commentTrigger: (
              <HelpMeDialog helpId="automation_comment_triggers" {...commentTriggerHelpProps} />
            ),
```

to:

```tsx
            commentTrigger: (
              <HelpMeDialog
                helpId="automation_comment_triggers"
                {...commentTriggerHelpProps}
                noAbsolute
              />
            ),
```

- [ ] **Step 2: Add the `titleAndEnabled` and `contentTypeHelpSlots` guides (BEF-140 items 4 and 5)**

Right after the `commentTriggerHelpProps` const block (now ending after the object above), add a new const that builds one guide per content type — purely CMS-driven (`helpId` only, no `videoSrc`), per the "bind new ones with the guide management system" instruction:

```tsx
  // One guide per content type (BEF-140 item 4: "every content type needs a guide next
  // to its title"), keyed by `AutomationContentTypesEnum`. Unlike the other help props
  // above, these are brand-new guide locations with nothing hardcoded — content only
  // ever comes from the Admin-managed `/guides/:helpId` CMS (see `guides-table.tsx`).
  const contentTypeHelpSlots = Object.fromEntries(
    Object.values(AutomationContentTypesEnum).map((type) => [
      type,
      <HelpMeDialog
        key={type}
        helpId={`automation_content_${type}`}
        title={t(`Contents.Types.buttons.descriptions.${type}`)}
        noAbsolute
      />,
    ]),
  ) as Partial<Record<AutomationContentTypesEnum, React.ReactNode>>;
```

In the `helpSlots={{ ... }}` object (lines 573-591), add a `titleAndEnabled` entry — also purely CMS-driven (BEF-140 item 5, the "automated message name" field had no guide at all before this fix):

```tsx
          helpSlots={{
            triggers: <HelpMeDialog helpId="automation_triggers" {...triggersHelpProps} />,
            conditions: <HelpMeDialog helpId="automation_conditions" {...conditionsHelpProps} />,
            contents: (
              <HelpMeDialog
                helpId="automation_contents"
                title={t('Contents.Help.title')}
                description={t('Contents.Help.description')}
                videoSrc={WizardVideoLinks.Automations.Hints.Contents.video}
                noAbsolute
              />
            ),
            justFollowers: (
              <HelpMeDialog helpId="automation_just_followers" {...justFollowersHelpProps} />
            ),
            commentTrigger: (
              <HelpMeDialog
                helpId="automation_comment_triggers"
                {...commentTriggerHelpProps}
                noAbsolute
              />
            ),
            titleAndEnabled: (
              <HelpMeDialog
                helpId="automation_title"
                title={t('TitleAndEnabled.Help.title')}
                description={t('TitleAndEnabled.Help.description')}
                noAbsolute
              />
            ),
          }}
          contentTypeHelpSlots={contentTypeHelpSlots}
```

- [ ] **Step 3: Run the existing AutomationForm tests to make sure nothing broke**

Run: `cd apps/dashboard && npx vitest run src/components/Automations/AutomationForm.test.tsx src/components/Automations/AutomationForm.submit.test.tsx src/components/Automations/AutomationForm.draft.test.tsx src/components/Automations/AutomationForm.freeQuota.test.tsx src/components/Automations/AutomationForm.templateId.test.tsx`
Expected: PASS — these tests mount the real `AutomationForm`, so they exercise the new `contentTypeHelpSlots`/`titleAndEnabled` wiring end-to-end without needing new dedicated tests for this task.

- [ ] **Step 4: Commit**

```bash
git add apps/dashboard/src/components/Automations/AutomationForm.tsx
git commit -m "fix(dashboard): fix misplaced start-request guide, add title and per-content-type guides"
```

---

### Task 6: Admin — register the new `helpId`s in the guide-management dropdown (BEF-140 item 7)

**Files:**
- Modify: `apps/admin/src/app/(main)/guides/guides-table.tsx`

**Interfaces:**
- Consumes: the exact `helpId` string literals introduced in Task 5 (`automation_title`, `automation_content_audio`, `automation_content_button_template`, `automation_content_image`, `automation_content_instagram_post`, `automation_content_product`, `automation_content_text`, `automation_content_video`, `automation_content_question`, `automation_content_vitrin`, `automation_content_delay`).

- [ ] **Step 1: Implement**

In `apps/admin/src/app/(main)/guides/guides-table.tsx`, the `helpId` `<Select>`'s `<SelectContent>` (lines 764-796) currently ends with:

```tsx
                          <SelectItem value="automation_contents">
                            اتوماسیون - محتوای ربات (Contents)
                          </SelectItem>
                          <SelectItem value="dashboard_general_help">
                            داشبورد - ویدیو راهنمای کلی خانه
                          </SelectItem>
                        </SelectContent>
```

Insert the 11 new options between `automation_contents` and `dashboard_general_help`:

```tsx
                          <SelectItem value="automation_contents">
                            اتوماسیون - محتوای ربات (Contents)
                          </SelectItem>
                          <SelectItem value="automation_title">
                            اتوماسیون - نام پیام خودکار
                          </SelectItem>
                          <SelectItem value="automation_content_text">
                            اتوماسیون - محتوا: متن
                          </SelectItem>
                          <SelectItem value="automation_content_button_template">
                            اتوماسیون - محتوا: دکمه و لینک
                          </SelectItem>
                          <SelectItem value="automation_content_vitrin">
                            اتوماسیون - محتوا: ویترین محصولات
                          </SelectItem>
                          <SelectItem value="automation_content_image">
                            اتوماسیون - محتوا: تصویر
                          </SelectItem>
                          <SelectItem value="automation_content_video">
                            اتوماسیون - محتوا: ویدیو
                          </SelectItem>
                          <SelectItem value="automation_content_audio">
                            اتوماسیون - محتوا: صدا
                          </SelectItem>
                          <SelectItem value="automation_content_instagram_post">
                            اتوماسیون - محتوا: پست اینستاگرام
                          </SelectItem>
                          <SelectItem value="automation_content_product">
                            اتوماسیون - محتوا: فروش مستقیم
                          </SelectItem>
                          <SelectItem value="automation_content_question">
                            اتوماسیون - محتوا: دریافت اطلاعات
                          </SelectItem>
                          <SelectItem value="automation_content_delay">
                            اتوماسیون - محتوا: تأخیر (Delay)
                          </SelectItem>
                          <SelectItem value="dashboard_general_help">
                            داشبورد - ویدیو راهنمای کلی خانه
                          </SelectItem>
                        </SelectContent>
```

- [ ] **Step 2: Commit**

```bash
git add "apps/admin/src/app/(main)/guides/guides-table.tsx"
git commit -m "feat(admin): register new automation guide locations in the guide-management dropdown"
```

---

### Task 7: Docs — update knowledge/updates per CLAUDE.md §4

**Files:**
- Create: `Front/knowledge/updates/2026-08-03-guideHelperFixes.update.md` (create `Front/knowledge/updates/` if it doesn't exist)

**Interfaces:** None — documentation only.

- [ ] **Step 1: Check whether `Front/knowledge/updates/` exists**

Run: `ls Front/knowledge/updates 2>/dev/null || echo MISSING`

- [ ] **Step 2: Write the update doc**

Follow the existing update-doc format (title+date, pointer, Problem/Solution/Changes/Verification). Content:

```markdown
# 2026-08-03 — Guide (راهنما) Dialog Fixes (BEF-140)

Reference: `apps/dashboard/src/components/Global/HelpMeDialog.tsx`, `packages/ui/src/automation-builder/`

## Problem
The in-app guide dialog had several usability bugs (Linear BEF-140): its close button
lived at the bottom instead of a familiar top X; on iPhone the guide video auto-entered
fullscreen; several UI sections (per-content-type, the automated message name field) had
no guide at all; the "start request message" guide rendered absolutely-positioned and
overlapped the delete button instead of sitting next to its label; and newly added guide
locations had no way to be managed from the Admin CMS.

## Solution
- Moved the close control to a `DialogClose` + `X` icon in the dialog's top-right corner
  (the header already reserved that space via `pl-6`); removed the old bottom "بستن"
  button.
- Added `playsInline` to the guide's `<video>` element — iOS Safari auto-fullscreens any
  `<video>` without it.
- Extended the shared `AutomationBuilder` package's slot system: `TitleAndEnabled` and
  `ContentItem` now accept a `helpSlot`/`contentTypeHelpSlots`, letting the dashboard
  inject a `HelpMeDialog` per content type and for the automated-message-name field.
  These new guides are purely CMS-driven (`helpId` only, no hardcoded `videoSrc`) —
  content/video must be added via the Admin guides page.
- Fixed the "start request message" guide's positioning by passing `noAbsolute` (it was
  rendering `position: 'left'` → `absolute`, overlapping the header's delete button).
- Registered all new `helpId`s (`automation_title`, `automation_content_<type>` × 10) in
  the Admin guides page's `helpId` dropdown.

## Changes
- `apps/dashboard/src/components/Global/HelpMeDialog.tsx`
- `packages/ui/src/automation-builder/Form/TitleAndEnabled.tsx`
- `packages/ui/src/automation-builder/AutomationBuilder.types.ts`
- `packages/ui/src/automation-builder/AutomationBuilder.tsx`
- `packages/ui/src/automation-builder/Contents/Contents.tsx`
- `packages/ui/src/automation-builder/Contents/ContentItem.tsx`
- `apps/dashboard/src/components/Automations/AutomationForm.tsx`
- `apps/dashboard/src/messages/fa.json`
- `apps/admin/src/app/(main)/guides/guides-table.tsx`

## Verification
- `apps/dashboard/src/components/Global/__tests__/HelpMeDialog.test.tsx` (new)
- `packages/ui/src/automation-builder/__tests__/AutomationBuilder.test.tsx`
- `packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx`
- `apps/dashboard/src/components/Automations/AutomationForm*.test.tsx`
- Not covered by automated tests: slow video playback (BEF-140 item 2 — explicitly out of
  scope), and actually publishing guide content/video for the new `helpId`s via the Admin
  CMS (a content task, not a code task — the dialogs render title-only until an admin adds
  content).
```

- [ ] **Step 3: Commit**

```bash
git add Front/knowledge/updates/2026-08-03-guideHelperFixes.update.md
git commit -m "docs(front): record BEF-140 guide dialog fixes"
```

---

## Self-Review Notes

- **Spec coverage:** BEF-140 items 1 (close button), 3 (iPhone fullscreen), 4 (per-content-type guides), 5 (title-field guide), 6 (misplaced start-request guide), 7 (Admin dropdown) are each covered by a task above. Item 2 (slow video) is explicitly excluded per the user's instruction.
- **No hardcoded URLs touched:** `wizardVideoLinks.conf.ts` is never opened in this plan; every new `<HelpMeDialog>` instance added (Tasks 5) omits `videoSrc` entirely, relying only on `helpId` + the Admin CMS.
- **Type consistency:** `contentTypeHelpSlots: Partial<Record<AutomationContentTypesEnum, React.ReactNode>>` is defined once in `AutomationBuilder.types.ts` (Task 3) and reused with the identical shape in `Contents.tsx` (Task 4) and `AutomationForm.tsx` (Task 5) — no renaming across tasks.
