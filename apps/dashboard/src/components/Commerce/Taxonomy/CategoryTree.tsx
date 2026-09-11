'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
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
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVerticalIcon } from '@phosphor-icons/react/dist/ssr';
import { PencilIcon, Trash2Icon } from 'lucide-react';

import api from '@/hooks/swr/api-client';
import { usePermissions } from '@/hooks/usePermissions';
import type { CommerceCategory, CommerceCategoryNode, PaginatedResult } from '@/types/commerce';
import type { ExceptionMessage } from '@/types/exceptionMessage';
import { buildCategoryTree } from '@/utils/commerce/buildCategoryTree';

import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { DeleteConfirmationDialog } from '@/components/Global/DeleteConfirmationDialog';
import { CategoryDialog, categoriesKey } from './CategoryDialog';

interface CategoryTreeProps {
  isCreateDialogOpen: boolean;
  onCreateDialogOpenChange: (open: boolean) => void;
}

// `GET /commerce/categories` returns a FLAT list (`PaginatedResult<CommerceCategory[]>`, per
// project convention for array responses — see CLAUDE.md §9). There is no pre-nested tree
// endpoint: `buildCategoryTree` (Task 1) is the single place that turns the flat list into a
// `CommerceCategoryNode[]` — reused here, never reimplemented.
export const CategoryTree = ({
  isCreateDialogOpen,
  onCreateDialogOpenChange,
}: CategoryTreeProps) => {
  const t = useTranslations('Commerce.Taxonomy.Category');
  const t_ec = useTranslations('ERROR_CODES');
  const { can } = usePermissions();
  // Verified against the real backend controller (`categories.controller.ts`): create,
  // update, delete, AND reorder (a `PUT` per moved node) all require the SAME `PRODUCT_EDIT`
  // permission — there is no separate create/delete slug for categories.
  const canEdit = can('product:edit');

  const {
    data: categoriesData,
    error: categoriesError,
    isLoading: isCategoriesLoading,
  } = useSWRImmutable<PaginatedResult<CommerceCategory[]>>(categoriesKey);

  const categories = categoriesData?.items ?? [];
  const tree = useMemo(() => buildCategoryTree(categoriesData?.items ?? []), [categoriesData]);

  const [editingCategory, setEditingCategory] = useState<CommerceCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CommerceCategory | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Sibling-only reorder: dragging a node onto another node that shares the SAME `parentId`
  // reorders both within that parent. Dragging onto a node under a DIFFERENT parent is a
  // deliberate scope reduction (see Task 9 report) — it's treated as a no-op (the item snaps
  // back, nothing is sent) rather than a half-working re-parent-by-drag interaction.
  // Re-parenting a category is done through `CategoryDialog`'s parent select instead, which
  // the server's `COMMERCE_CATEGORY_CYCLE` check still guards.
  const handleDragEnd = async (event: DragEndEvent) => {
    // Defense-in-depth: the backend already enforces `product:edit` on
    // `PUT /commerce/categories/:id`, but the reorder request must never even fire when the
    // viewer lacks the permission — every node's drag handle is also disabled below.
    if (!canEdit) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCategory = categories.find((c) => c.id === active.id);
    const overCategory = categories.find((c) => c.id === over.id);
    if (!activeCategory || !overCategory) return;
    if (activeCategory.parentId !== overCategory.parentId) return;

    const siblings = categories
      .filter((c) => c.parentId === activeCategory.parentId)
      .sort((a, b) => a.position - b.position);

    const oldIndex = siblings.findIndex((c) => c.id === active.id);
    const newIndex = siblings.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(siblings, oldIndex, newIndex);

    // Optimistic re-render straight into the shared SWR cache (not a local `useState`) with
    // `revalidate: false`, same convention as `MediaSection#handleDragEnd` — the final
    // `mutate(categoriesKey)` in `finally` revalidates for real once the PUTs settle.
    await mutate(
      categoriesKey,
      (current: PaginatedResult<CommerceCategory[]> | undefined) =>
        current && {
          ...current,
          items: current.items.map((c) => {
            const newPosition = reordered.findIndex((r) => r.id === c.id);
            return newPosition === -1 ? c : { ...c, position: newPosition };
          }),
        },
      { revalidate: false },
    );

    try {
      await Promise.all(
        reordered.map((c, index) =>
          api.put(`/commerce/categories/${c.id}`, { parentId: c.parentId, position: index }),
        ),
      );
    } catch (error) {
      const code = isAxiosError(error)
        ? (error.response?.data as ExceptionMessage | undefined)?.code
        : undefined;
      toast.error(code ? t_ec(code) : t('reorderError'));
    } finally {
      await mutate(categoriesKey);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory || !canEdit) return;

    try {
      await api.delete(`/commerce/categories/${deletingCategory.id}`);
      toast.success(t('deleteSuccess'));
    } catch (error) {
      const code = isAxiosError(error)
        ? (error.response?.data as ExceptionMessage | undefined)?.code
        : undefined;
      toast.error(code ? t_ec(code) : t('deleteError'));
    } finally {
      setDeletingCategory(null);
      await mutate(categoriesKey);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isCategoriesLoading ? (
          <LoaderSpin />
        ) : categoriesError ? (
          <p className="text-destructive text-sm">{t('loadError')}</p>
        ) : tree.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <CategoryTreeLevel
              nodes={tree}
              depth={0}
              onEdit={setEditingCategory}
              onDelete={setDeletingCategory}
              editLabel={t('edit')}
              deleteLabel={t('delete')}
              canEdit={canEdit}
            />
          </DndContext>
        )}
      </CardContent>

      <CategoryDialog
        open={isCreateDialogOpen}
        onOpenChange={onCreateDialogOpenChange}
        categories={categories}
      />

      <CategoryDialog
        open={!!editingCategory}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null);
        }}
        categories={categories}
        category={editingCategory ?? undefined}
      />

      <DeleteConfirmationDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteConfirm}
      />
    </Card>
  );
};

interface CategoryTreeLevelProps {
  nodes: CommerceCategoryNode[];
  depth: number;
  onEdit: (category: CommerceCategory) => void;
  onDelete: (category: CommerceCategory) => void;
  editLabel: string;
  deleteLabel: string;
  canEdit: boolean;
}

const CategoryTreeLevel = ({
  nodes,
  depth,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  canEdit,
}: CategoryTreeLevelProps) => (
  <SortableContext items={nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
    <div className="flex flex-col gap-1.5">
      {nodes.map((node) => (
        <CategoryTreeNode
          key={node.id}
          node={node}
          depth={depth}
          onEdit={onEdit}
          onDelete={onDelete}
          editLabel={editLabel}
          deleteLabel={deleteLabel}
          canEdit={canEdit}
        />
      ))}
    </div>
  </SortableContext>
);

interface CategoryTreeNodeProps {
  node: CommerceCategoryNode;
  depth: number;
  onEdit: (category: CommerceCategory) => void;
  onDelete: (category: CommerceCategory) => void;
  editLabel: string;
  deleteLabel: string;
  canEdit: boolean;
}

const CategoryTreeNode = ({
  node,
  depth,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  canEdit,
}: CategoryTreeNodeProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: node.id,
    disabled: !canEdit,
  });

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginInlineStart: depth * 20,
  };

  return (
    <div>
      <div
        ref={setNodeRef}
        style={dndStyle}
        data-testid={`category-node-${node.id}`}
        className="bg-card flex items-center gap-2 rounded-md border px-2 py-1.5"
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-gray-500 active:cursor-grabbing"
        >
          <DotsSixVerticalIcon size={16} />
        </button>

        <span className="flex-1 truncate text-sm">{node.name}</span>

        {canEdit && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(node)}>
            <PencilIcon className="size-4 text-green-600" />
            <span className="sr-only">{editLabel}</span>
          </Button>
        )}

        {canEdit && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onDelete(node)}>
            <Trash2Icon className="text-destructive size-4" />
            <span className="sr-only">{deleteLabel}</span>
          </Button>
        )}
      </div>

      {node.children.length > 0 && (
        <div className="mt-1.5">
          <CategoryTreeLevel
            nodes={node.children}
            depth={depth + 1}
            onEdit={onEdit}
            onDelete={onDelete}
            editLabel={editLabel}
            deleteLabel={deleteLabel}
            canEdit={canEdit}
          />
        </div>
      )}
    </div>
  );
};
