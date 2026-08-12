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
