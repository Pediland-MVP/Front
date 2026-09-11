import { CommerceCategory, CommerceCategoryNode } from '@/types/commerce';

export function buildCategoryTree(flat: CommerceCategory[]): CommerceCategoryNode[] {
  const byId = new Map<string, CommerceCategoryNode>(
    flat.map((c) => [c.id, { ...c, children: [] }]),
  );
  const roots: CommerceCategoryNode[] = [];

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (nodes: CommerceCategoryNode[]) => {
    nodes.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, 'fa'));
    nodes.forEach((n) => sortTree(n.children));
  };
  sortTree(roots);
  return roots;
}
