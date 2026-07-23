import { describe, it, expect } from 'vitest';
import { buildCategoryTree } from './buildCategoryTree';
import { CommerceCategory } from '@/types/commerce';

const cat = (o: Partial<CommerceCategory> & { id: string; name: string }): CommerceCategory => ({
  workspaceId: 'ws-1',
  slug: o.name,
  parentId: null,
  position: 0,
  ...o,
});

describe('buildCategoryTree', () => {
  it('nests children under their parent, sorted by position', () => {
    const flat = [
      cat({ id: 'food', name: 'خوراکی', position: 0 }),
      cat({ id: 'organic', name: 'ارگانیک', parentId: 'food', position: 1 }),
      cat({ id: 'nuts', name: 'خشکبار', parentId: 'food', position: 0 }),
    ];
    const tree = buildCategoryTree(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('food');
    expect(tree[0].children.map((c) => c.id)).toEqual(['nuts', 'organic']);
  });

  it('treats a dangling parentId (parent not in the list) as a root', () => {
    const flat = [cat({ id: 'orphan', name: 'یتیم', parentId: 'missing-parent' })];
    expect(buildCategoryTree(flat)).toHaveLength(1);
  });

  it('returns [] for an empty list', () => {
    expect(buildCategoryTree([])).toEqual([]);
  });
});
