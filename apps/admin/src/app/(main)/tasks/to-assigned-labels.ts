import { TaskListItem } from '@/types/task';
import { AssignedLabel } from '@/types/label';

/**
 * Map TaskLabel[] → AssignedLabel[] so LabelChips receives its expected shape.
 * Shared between task-drawer.tsx and columns.tsx.
 */
export function toAssignedLabels(labels: TaskListItem['labels']): AssignedLabel[] {
  return labels.map((l) => ({
    labelId: l.id,
    assignedAt: '',
    label: { id: l.id, name: l.name, color: l.color },
  }));
}
