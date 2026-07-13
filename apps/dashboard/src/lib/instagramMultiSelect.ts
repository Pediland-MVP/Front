/**
 * Toggles `id` in `selectedIds`, never allowing the selection to become empty.
 * Shared by InstagramSelectField.tsx and (eventually) InstagramFilter.tsx, which
 * both need the same "at least one Instagram must stay selected" rule.
 */
export function toggleInstagramSelection(selectedIds: string[], id: string): string[] {
  if (selectedIds.includes(id)) {
    if (selectedIds.length === 1) return selectedIds;
    return selectedIds.filter((s) => s !== id);
  }
  return [...selectedIds, id];
}
