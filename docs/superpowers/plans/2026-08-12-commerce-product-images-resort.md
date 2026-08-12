# Resortable Product Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a merchant drag-and-drop reorder a product's media pool in the product editor, persisting the new order to the backend.

**Architecture:** Front-only. The product editor's media grid (`MediaSection.tsx`) gets `@dnd-kit` drag-and-drop (already a dependency, already used the same way in `components/Products/FormCustomFields.tsx`); each tile moves into a new `SortableMediaTile` subcomponent with a drag handle. `ProductEditorPage.tsx` gets a new `handleReorderMedia` callback that optimistically reorders the form's `media` field and, in edit mode, calls the already-built-and-tested `PATCH /commerce/products/:id/media` endpoint, rolling back on failure.

**Tech Stack:** Next.js dashboard app (`apps/dashboard`), React Hook Form, `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`, `next-intl`, `vitest` + `@testing-library/react`.

## Global Constraints

- No backend changes — reuse `PATCH /commerce/products/:id/media { mediaIds }` exactly as it exists today (`Back/apps/core/src/commerce/media/media.controller.ts:85-103`, `media.service.ts:244-271`).
- No new dependency — `@dnd-kit/core`/`@dnd-kit/sortable`/`@dnd-kit/utilities` are already in `apps/dashboard/package.json`.
- New user-facing strings go in `apps/dashboard/src/messages/fa.json` only (`en.json` is translated later, per CLAUDE.md §8).
- Per CLAUDE.md §7: after each task, run only the test file(s) that task touches — not the whole suite.
- Per CLAUDE.md §3/§4: add a dated update doc under `knowledge/updates/` and a row in `knowledge/knowledgeMap.doc.md` once the feature is done.
- All work happens in the existing worktree `Front/worktrees/commerce-product-core` (branch `feat/commerce-product-core`) — do not create a new worktree, do not touch the main `Front/` checkout.

---

### Task 1: Drag-and-drop UI in the media pool

**Files:**
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/sections/SortableMediaTile.tsx`
- Modify: `apps/dashboard/src/components/Commerce/ProductEditor/sections/MediaSection.tsx`
- Modify: `apps/dashboard/src/messages/fa.json` (add two keys)
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/sections/MediaSection.test.tsx`

**Interfaces:**
- Produces: `SortableMediaTile` component, props `{ item: EditorMedia, index: number, isCover: boolean, isBusy: boolean, removeLabel: string, reorderLabel: string, coverLabel: string, videoLabel: string, pendingLabel: string, onRemove: (item: EditorMedia) => void }`.
- Produces: `MediaSection` gains a new required prop `onReorder: (newOrder: EditorMedia[]) => void`. Every other existing prop (`step`, `productId`, `media`, `isBusy`, `onAdd`, `onRemove`) is unchanged.
- Consumes: `EditorMedia` type from `../productEditor.schema` (already defined, unchanged).

- [ ] **Step 1: Add the two new i18n keys**

Open `apps/dashboard/src/messages/fa.json`, find the `Commerce.Editor.Media` object (currently ends with `"busyHint": "تا پایان این کار، افزودن یا حذف فایل ممکن نیست."`), and add two keys immediately after it:

```json
"reorderError": "جابجایی ترتیب فایل‌ها انجام نشد. دوباره تلاش کنید.",
"reorderHandle": "جابجایی {name}"
```

- [ ] **Step 2: Create `SortableMediaTile.tsx`**

```tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon, XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { EditorMedia } from '../productEditor.schema';

/**
 * One tile in the media pool, now sortable. Split out of `MediaSection.tsx` for the same reason
 * `SortableFieldItem.tsx` is split out of `FormCustomFields.tsx`: `useSortable` must be called
 * once per draggable item, inside that item, not in the parent that maps over all of them.
 *
 * The drag handle is a SEPARATE element from the existing ✕ remove button — spreading
 * `{...attributes} {...listeners}` on the whole tile would make it fight the remove button for
 * the same pointerdown.
 */
export const SortableMediaTile = ({
  item,
  index,
  isCover,
  isBusy,
  removeLabel,
  reorderLabel,
  coverLabel,
  videoLabel,
  pendingLabel,
  onRemove,
}: {
  item: EditorMedia;
  index: number;
  isCover: boolean;
  isBusy: boolean;
  removeLabel: string;
  reorderLabel: string;
  coverLabel: string;
  videoLabel: string;
  pendingLabel: string;
  onRemove: (item: EditorMedia) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    disabled: isBusy,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-1.5">
      <div
        title={item.name}
        data-testid={`media-tile-${item.id}`}
        className={cn(
          'border-ln bg-muted relative aspect-square overflow-hidden rounded-lg border',
          item.isPending && 'opacity-70',
        )}
      >
        {item.type === 'video' ? (
          <video
            src={item.url}
            poster={item.posterUrl ?? undefined}
            muted
            className="h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
        )}

        {/* Cover is positional, not a flag: whatever sits at index 0 is `position` 0. */}
        {isCover && (
          <span className="bg-ink absolute end-1.5 top-1.5 rounded-md px-2 py-px text-xs font-bold text-white">
            {coverLabel}
          </span>
        )}

        {item.type === 'video' && (
          <span className="bg-ink absolute end-1.5 bottom-1.5 rounded-md px-1.5 py-px text-xs font-bold text-white">
            {videoLabel}
          </span>
        )}

        {item.isPending && (
          <span className="bg-ink/80 absolute inset-x-0 bottom-0 py-0.5 text-center text-xs font-bold text-white">
            {pendingLabel}
          </span>
        )}

        {/* Listeners are omitted entirely while busy, not just visually disabled — this is what
            stops a drag from starting mid-upload/mid-delete/mid-reorder. */}
        {!isBusy && (
          <div
            {...attributes}
            {...listeners}
            aria-label={reorderLabel}
            data-testid={`media-drag-${item.id}`}
            className="hover:bg-dtint absolute start-1.5 bottom-1.5 grid size-6 cursor-grab touch-none place-items-center rounded-full bg-white/90 text-black transition-colors active:cursor-grabbing"
          >
            <GripVerticalIcon className="size-3.5" />
          </div>
        )}

        <button
          type="button"
          disabled={isBusy}
          aria-label={removeLabel}
          data-testid={`media-remove-${item.id}`}
          onClick={() => onRemove(item)}
          className="hover:bg-dtint hover:text-dtext absolute start-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white/90 text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XIcon className="size-3" />
        </button>
      </div>
      <div dir="ltr" className="text-mut truncate text-start text-xs">
        {item.name}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Wire drag-and-drop into `MediaSection.tsx`**

Replace the full file content with:

```tsx
'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { UploadIcon } from 'lucide-react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

import type { EditorMedia } from '../productEditor.schema';
import { EditorSection } from '../ui/EditorSection';
import { SortableMediaTile } from './SortableMediaTile';

/**
 * One tile in the media pool.
 *
 * `isPending` marks a file picked in CREATE mode: `commerce_product_media.productId` is NOT NULL
 * and the upload endpoint needs an id in its path, so there is nowhere to put the file until
 * `POST /commerce/products` has returned one. It renders from an object URL and the page uploads
 * it right after create (spec, decision 3).
 *
 * Re-exported, NOT redeclared: this file used to carry its own structurally identical copy, and
 * two definitions of the same tile drift the moment a field is added to one of them — silently,
 * because nothing in the type system compares them.
 */
export type { EditorMedia };

/**
 * Step ۴ — the media pool.
 *
 * Deliberately presentational plus a file picker: it never calls the API. Upload, delete and
 * reorder differ between create and edit mode and both need to touch the SWR cache and the
 * variant media ids, so they live in the page (Task 8, extended for reorder). This component only
 * says "the merchant chose these files" / "the merchant wants this one gone" / "the merchant
 * dropped this tile in a new spot".
 */
export const MediaSection = ({
  step = 4,
  productId,
  media,
  isBusy = false,
  onAdd,
  onRemove,
  onReorder,
}: {
  step?: number;
  productId?: string;
  media: EditorMedia[];
  /**
   * An upload, a delete, or a reorder is in flight. In EDIT mode all three are real API calls the
   * page makes on the spot, and they run one at a time — so without this the dropzone, the ✕
   * buttons and the drag handles would keep accepting interactions the page silently drops.
   */
  isBusy?: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (item: EditorMedia) => void;
  onReorder: (newOrder: EditorMedia[]) => void;
}) => {
  const t = useTranslations('Commerce.Editor.Media');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = media.findIndex((item) => item.id === active.id);
    const newIndex = media.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(media, oldIndex, newIndex));
  };

  const take = (list: FileList | null) => {
    if (isBusy) return;
    const files = Array.from(list ?? []);
    if (files.length) onAdd(files);
  };

  const hint = media.length
    ? t('count', { count: e2pNumbers(String(media.length)) })
    : productId
      ? undefined
      : t('pendingHint');

  return (
    <EditorSection step={step} title={t('title')} hint={hint} cardClassName="flex flex-col gap-3.5">
      <div
        role="button"
        tabIndex={isBusy ? -1 : 0}
        aria-disabled={isBusy}
        aria-busy={isBusy}
        data-testid="media-dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          if (!isBusy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files);
        }}
        onClick={() => {
          if (!isBusy) fileRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (isBusy) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        className={cn(
          'border-lnv bg-tint rounded-lg border-2 border-dashed px-5 py-6 text-center transition-colors',
          isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          dragging && 'border-primary bg-tint2',
        )}
      >
        <div className="border-lnv bg-card text-primary mx-auto mb-2.5 grid size-10 place-items-center rounded-lg border">
          <UploadIcon className="size-4.5" />
        </div>
        <div className="mb-1 text-sm font-bold">{isBusy ? t('busy') : t('dropTitle')}</div>
        <p className="text-mut m-0 text-xs text-pretty">{isBusy ? t('busyHint') : t('dropHint')}</p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            take(e.target.files);
            // Reset, so picking the SAME file twice in a row still fires a change event.
            e.target.value = '';
          }}
        />
      </div>

      {media.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={media.map((item) => item.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2.5">
              {media.map((item, index) => (
                <SortableMediaTile
                  key={item.id}
                  item={item}
                  index={index}
                  isCover={index === 0}
                  isBusy={isBusy}
                  removeLabel={t('remove', { name: item.name })}
                  reorderLabel={t('reorderHandle', { name: item.name })}
                  coverLabel={t('cover')}
                  videoLabel={t('video')}
                  pendingLabel={t('pending')}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </EditorSection>
  );
};
```

Note the accepted trade-off: for a tile that is both `isPending` and has the drag handle visible, the handle (bottom-start, small circular badge) sits slightly over the pending banner strip (`inset-x-0 bottom-0`) — both are bottom-anchored on a 112px tile and there is no other free corner (top-start is the remove button, top-end is the cover badge, bottom-end is the video badge). This is a minor visual overlap, not a functional bug; revisit only if it is reported as confusing in practice.

- [ ] **Step 4: Write `MediaSection.test.tsx`**

This mocks `@dnd-kit/core`'s `DndContext` and `@dnd-kit/sortable`'s `useSortable`/`SortableContext` so the test can trigger a drop deterministically (call the real `onDragEnd` handler directly with a synthetic event) instead of simulating real pointer/keyboard drag physics in `jsdom`, which has no layout engine for `@dnd-kit`'s collision math to use. `arrayMove` itself is NOT mocked — it stays real, so the test proves our code calls it correctly.

```tsx
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { EditorMedia } from '../productEditor.schema';

const { dragEndRef } = vi.hoisted(() => ({
  dragEndRef: { current: null as null | ((e: unknown) => void) },
}));

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: React.ReactNode;
      onDragEnd: (e: unknown) => void;
    }) => {
      dragEndRef.current = onDragEnd;
      return children;
    },
  };
});

vi.mock('@dnd-kit/sortable', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/sortable')>();
  return {
    ...actual,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      transition: undefined,
    }),
    SortableContext: ({ children }: { children: React.ReactNode }) => children,
  };
});

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
    (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver ||
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

import { MediaSection } from './MediaSection';

const media: EditorMedia[] = [
  { id: 'a', name: 'a.png', url: 'blob:a', type: 'image', isPending: false },
  { id: 'b', name: 'b.png', url: 'blob:b', type: 'image', isPending: false },
];

function renderSection(overrides: Partial<React.ComponentProps<typeof MediaSection>> = {}) {
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <MediaSection
        media={media}
        isBusy={false}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onReorder={vi.fn()}
        {...overrides}
      />
    </NextIntlClientProvider>,
  );
}

describe('MediaSection drag-and-drop reorder', () => {
  it('calls onReorder with the swapped order when a tile is dropped on another', () => {
    const onReorder = vi.fn();
    renderSection({ onReorder });

    dragEndRef.current?.({ active: { id: 'b' }, over: { id: 'a' } });

    expect(onReorder).toHaveBeenCalledWith([media[1], media[0]]);
  });

  it('does not call onReorder when a tile is dropped on itself', () => {
    const onReorder = vi.fn();
    renderSection({ onReorder });

    dragEndRef.current?.({ active: { id: 'a' }, over: { id: 'a' } });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('still renders the remove button and the cover badge unaffected', () => {
    renderSection();

    expect(screen.getByTestId('media-remove-a')).toBeInTheDocument();
    expect(screen.getByText(messages.Commerce.Editor.Media.cover)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run the new test file**

Run: `cd apps/dashboard && npx vitest run src/components/Commerce/ProductEditor/sections/MediaSection.test.tsx`
Expected: PASS, 3/3.

- [ ] **Step 6: Commit**

```bash
git add apps/dashboard/src/components/Commerce/ProductEditor/sections/MediaSection.tsx \
        apps/dashboard/src/components/Commerce/ProductEditor/sections/SortableMediaTile.tsx \
        apps/dashboard/src/components/Commerce/ProductEditor/sections/MediaSection.test.tsx \
        apps/dashboard/src/messages/fa.json
git commit -m "feat(commerce): drag-and-drop reorder UI in the media pool grid"
```

---

### Task 2: Persist the new order (`ProductEditorPage.tsx`)

**Files:**
- Modify: `apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.tsx`
- Test: `apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.test.tsx`

**Interfaces:**
- Consumes: `MediaSection`'s new `onReorder: (newOrder: EditorMedia[]) => void` prop (Task 1). `productDetailKey(productId: string): string` and `CATEGORIES_KEY`/`COLLECTIONS_KEY` already imported from `./useProductLoad`. `EditorMedia` from `./productEditor.schema`. The existing `mediaBusy` ref, `isMediaBusy` state, and `markMediaBusy` callback (already defined at `ProductEditorPage.tsx:389-394`).
- Produces: `handleReorderMedia(newOrder: EditorMedia[]): Promise<void>`, wired to `<MediaSection onReorder={...} />`.

- [ ] **Step 1: Add `handleReorderMedia`**

In `apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.tsx`, immediately after the existing `handleRemoveMedia` callback (ends at line 509 with `[canSubmit, detachMediaFromVariants, getValues, markMediaBusy, productId, setValue, t],\n  );`), add:

```tsx
  const handleReorderMedia = useCallback(
    async (newOrder: EditorMedia[]) => {
      if (!canSubmit || mediaBusy.current) return;

      // Snapshot for rollback BEFORE the optimistic write below.
      const previous = getValues('media');

      // Optimistic: a drag needs instant feedback, unlike a button-triggered add/remove where a
      // brief busy state is acceptable. Create mode has nothing to persist yet (see decision in
      // the spec), so `shouldDirty: true` there matches how the initial queued files are marked
      // dirty; edit mode persists immediately, so it is not an "unsaved" change.
      setValue('media', newOrder, { shouldDirty: !productId });

      if (!productId) return;

      markMediaBusy(true);
      try {
        await api.patch(`/commerce/products/${productId}/media`, {
          mediaIds: newOrder.map((item) => item.id),
        });
        // Fire-and-forget, matching handleRemoveMedia: the order is already known locally, this
        // just keeps the shared SWR cache from going stale for any other consumer.
        void mutate(productDetailKey(productId));
      } catch {
        setValue('media', previous, { shouldDirty: false });
        toast.error(t('Media.reorderError'));
      } finally {
        markMediaBusy(false);
      }
    },
    [canSubmit, getValues, markMediaBusy, productId, setValue, t],
  );
```

- [ ] **Step 2: Wire the prop**

Find the `<MediaSection ... />` usage (around line 715):

```tsx
          <MediaSection
            step={STEPS.media}
            productId={productId}
            media={media}
            isBusy={isMediaBusy}
            onAdd={(files) => void handleAddMedia(files)}
            onRemove={(item) => void handleRemoveMedia(item)}
          />
```

Add the new prop:

```tsx
          <MediaSection
            step={STEPS.media}
            productId={productId}
            media={media}
            isBusy={isMediaBusy}
            onAdd={(files) => void handleAddMedia(files)}
            onRemove={(item) => void handleRemoveMedia(item)}
            onReorder={(newOrder) => void handleReorderMedia(newOrder)}
          />
```

- [ ] **Step 3: Extend the test file's mocks**

In `apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.test.tsx`:

Change the hoisted `api` mock (currently `get/post/put/delete`) to add `patch`:

```ts
const { api } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
```

Immediately after the existing `vi.mock('sonner', ...)` block, add the same `@dnd-kit` mocks used in `MediaSection.test.tsx` (Task 1) — needed here too because `ProductEditorPage` renders a real `MediaSection`, which sets up its own `DndContext`:

```ts
const { dragEndRef } = vi.hoisted(() => ({
  dragEndRef: { current: null as null | ((e: unknown) => void) },
}));

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: React.ReactNode;
      onDragEnd: (e: unknown) => void;
    }) => {
      dragEndRef.current = onDragEnd;
      return children;
    },
  };
});

vi.mock('@dnd-kit/sortable', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/sortable')>();
  return {
    ...actual,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      transition: undefined,
    }),
    SortableContext: ({ children }: { children: React.ReactNode }) => children,
  };
});

function fireMediaDragEnd(activeId: string, overId: string) {
  dragEndRef.current?.({ active: { id: activeId }, over: { id: overId } });
}

function mediaTileIds() {
  return screen
    .getAllByTestId(/^media-tile-/)
    .map((el) => el.getAttribute('data-testid')!.replace('media-tile-', ''));
}
```

Add `URL.createObjectURL`/`URL.revokeObjectURL` stubs to the existing `beforeAll` block (needed for the create-mode test below, which drives the real file-picker path):

```ts
beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
    (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver ||
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
});
```

Add `import { mutate } from 'swr';` and `import { toast } from 'sonner';` near the top of the file (both modules are already mocked above, so these imports resolve to the mocked `vi.fn()`s) so the new tests can assert on them:

```ts
import { mutate } from 'swr';
import { toast } from 'sonner';
```

- [ ] **Step 4: Add the three reorder tests**

Add a fixture for two persisted media items and a `media: CommerceProductMedia[]` import type, then a new `describe` block. Add near the top, after the `detail` factory:

```ts
import type { CommerceProductDetail, CommerceProductMedia } from '@/types/commerce';

const twoMedia: CommerceProductMedia[] = [
  { id: 'media-1', type: 'image', position: 0, alt: null, url: 'https://cdn/1.png', posterUrl: null },
  { id: 'media-2', type: 'image', position: 1, alt: null, url: 'https://cdn/2.png', posterUrl: null },
];
```

(`CommerceProductDetail` is already imported at the top of the file — extend that existing import statement with `CommerceProductMedia` rather than adding a second one.)

Then, inside `describe('ProductEditorPage', ...)`, after the last existing `it(...)`:

```ts
  describe('media reorder', () => {
    it('reorders pending media locally in create mode, without an API call', async () => {
      stubReads(undefined);
      renderEditor({ mode: 'create' });

      const fileInput = screen
        .getByTestId('media-dropzone')
        .querySelector('input[type="file"]') as HTMLInputElement;
      const fileA = new File(['a'], 'a.png', { type: 'image/png' });
      const fileB = new File(['b'], 'b.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [fileA, fileB] } });

      await waitFor(() => expect(mediaTileIds()).toHaveLength(2));
      const [firstId, secondId] = mediaTileIds();

      fireMediaDragEnd(secondId, firstId);

      await waitFor(() => expect(mediaTileIds()).toEqual([secondId, firstId]));
      expect(api.patch).not.toHaveBeenCalled();
    });

    it('persists the new order via PATCH and refreshes the cache in edit mode', async () => {
      stubReads(detail({ media: twoMedia }));
      api.patch.mockResolvedValue({});

      renderEditor({ mode: 'edit', productId: 'prod-1' });
      await waitFor(() => expect(mediaTileIds()).toEqual(['media-1', 'media-2']));

      fireMediaDragEnd('media-2', 'media-1');

      await waitFor(() => expect(mediaTileIds()).toEqual(['media-2', 'media-1']));
      await waitFor(() =>
        expect(api.patch).toHaveBeenCalledWith('/commerce/products/prod-1/media', {
          mediaIds: ['media-2', 'media-1'],
        }),
      );
      await waitFor(() => expect(mutate).toHaveBeenCalledWith('/commerce/products/prod-1'));
    });

    it('rolls back the order and shows an error toast when the PATCH fails', async () => {
      stubReads(detail({ media: twoMedia }));
      api.patch.mockRejectedValue(new Error('network'));

      renderEditor({ mode: 'edit', productId: 'prod-1' });
      await waitFor(() => expect(mediaTileIds()).toEqual(['media-1', 'media-2']));

      fireMediaDragEnd('media-2', 'media-1');
      await waitFor(() => expect(mediaTileIds()).toEqual(['media-2', 'media-1']));

      await waitFor(() => expect(mediaTileIds()).toEqual(['media-1', 'media-2']));
      expect(toast.error).toHaveBeenCalledWith(messages.Commerce.Editor.Media.reorderError);
    });
  });
```

- [ ] **Step 5: Run the test file**

Run: `cd apps/dashboard && npx vitest run src/components/Commerce/ProductEditor/ProductEditorPage.test.tsx`
Expected: PASS, all tests including the 3 new ones (8 total).

- [ ] **Step 6: Commit**

```bash
git add apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.tsx \
        apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.test.tsx
git commit -m "feat(commerce): persist product media reorder via the existing PATCH endpoint"
```

---

### Task 3: Knowledge docs

**Files:**
- Create: `knowledge/updates/2026-08-12-commerceMediaPoolResort.update.md`
- Modify: `knowledge/knowledgeMap.doc.md`

**Interfaces:** None — documentation only.

- [ ] **Step 1: Write the update doc**

Create `knowledge/updates/2026-08-12-commerceMediaPoolResort.update.md`:

```markdown
# Resortable Product Images — 2026-08-12

Spec: `docs/superpowers/specs/2026-08-12-commerce-product-images-resort-design.md`
Plan: `docs/superpowers/plans/2026-08-12-commerce-product-images-resort.md`

## Problem

The product editor's media pool (`MediaSection.tsx`) showed images/videos in upload (arrival)
order with index 0 rendered as "cover", but a merchant had no way to change that order after
upload. The backend reorder endpoint for this (`PATCH /commerce/products/:id/media`) was already
built, tested, and permission-gated as part of the original media-endpoints work — it was simply
never called from the frontend.

## Solution

Drag-and-drop added to the media pool grid using `@dnd-kit` (already a dependency, already used
the same way in `components/Products/FormCustomFields.tsx` + `SortableFieldItem.tsx`). No backend
change — the existing `MediaService.reorderMedia` is reused as-is.

## Changes

- `sections/SortableMediaTile.tsx` (new): the pool tile, now `useSortable`, with a dedicated drag
  handle separate from the existing ✕ remove button.
- `sections/MediaSection.tsx`: wraps the grid in `DndContext`/`SortableContext`
  (`rectSortingStrategy`, grid-aware), gains an `onReorder: (newOrder: EditorMedia[]) => void`
  prop. Drag is disabled whenever `isBusy` (same flag already gating the dropzone and remove
  buttons).
- `ProductEditorPage.tsx`: new `handleReorderMedia`, sharing the existing `mediaBusy` guard with
  `handleAddMedia`/`handleRemoveMedia`. Optimistically reorders the form's `media` field on drop;
  in edit mode also calls `PATCH /commerce/products/:id/media` and rolls back to the pre-drag
  order on failure. Create mode (no `productId` yet) is local-only — the order is simply what
  gets uploaded once the product is first created.
- `fa.json`: two new `Commerce.Editor.Media` keys, `reorderError` and `reorderHandle`.

## Verification

`ProductEditorPage.test.tsx` and `MediaSection.test.tsx` — 3 new reorder tests (create-mode
local reorder, edit-mode PATCH + cache refresh, edit-mode rollback + error toast) plus 3 new
`MediaSection`-level tests for the drag-end wiring. All pass; run with:
`cd apps/dashboard && npx vitest run src/components/Commerce/ProductEditor/sections/MediaSection.test.tsx src/components/Commerce/ProductEditor/ProductEditorPage.test.tsx`

No manual in-browser verification yet — flag for the user before this ships.
```

- [ ] **Step 2: Add the row to `knowledgeMap.doc.md`**

In `knowledge/knowledgeMap.doc.md`, add a new row at the end of the table (after the
`2026-08-09-connectUnboundPlanChoice.update.md` row):

```markdown
| `2026-08-12-commerceMediaPoolResort.update.md` | `Front/knowledge/updates/2026-08-12-commerceMediaPoolResort.update.md` | Adds drag-and-drop reorder to the product editor's media pool (`MediaSection.tsx` + new `SortableMediaTile.tsx`, `@dnd-kit`, same pattern as `components/Products/FormCustomFields.tsx`), wired to the backend's already-built `PATCH /commerce/products/:id/media` endpoint via a new `ProductEditorPage.tsx` `handleReorderMedia` (optimistic, rolls back on failure, local-only in create mode). No backend change. |
```

- [ ] **Step 3: Commit**

```bash
git add knowledge/updates/2026-08-12-commerceMediaPoolResort.update.md knowledge/knowledgeMap.doc.md
git commit -m "docs(commerce): update doc for resortable product images"
```

---

## Manual verification (do this before considering the feature done)

Per CLAUDE.md's UI-change guidance, run the dev server and check the feature in a real browser
before calling it complete:

1. Start the dashboard dev server (ask the user before doing this if a per-task dev-server run
   hasn't already been explicitly approved this session — see `feedback_no_per_task_devserver`
   memory).
2. Open a product with 2+ images in the editor. Drag a non-cover tile to position 0 using the
   grip handle. Confirm: the "اصلی" (cover) badge moves to the dropped tile immediately, a network
   tab shows one `PATCH /commerce/products/:id/media` call with the full id list in the new order,
   and reloading the page keeps the new order.
3. Start creating a new product, add 2+ images before saving. Confirm dragging reorders them
   locally with no network call, and after Save the uploaded order matches what was dragged.
4. Temporarily block the PATCH request (e.g. devtools network throttling/offline) and drag a
   tile in edit mode — confirm it snaps back to the old order and an error toast appears.
