// Duplicated (not imported) from the dashboard's
// `apps/dashboard/src/components/Commerce/ProductEditor/testUtils/dndKitTestMocks.ts`
// (introduced in `31da4534` to dedupe this exact mock across that app's own tests).
// `packages/ui` is a separate workspace package with its own vitest config/module
// resolution -- it cannot reach into `apps/dashboard`'s source tree, and depending the
// other direction (dashboard -> packages/ui is the only allowed direction) would be a
// layering violation -- so this is a verbatim copy of that same mock, not a second
// hand-rolled dnd-kit testing idiom.
import { vi } from 'vitest';

const { dragEndRef } = vi.hoisted(() => ({
  dragEndRef: { current: null as null | ((e: unknown) => void) },
}));

export { dragEndRef };

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
