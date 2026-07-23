import { toggleProductInCollectionMembership } from './toggleProductInCollection';
import { CommerceCollectionListItem } from '@/types/commerce';

const collection = (
  overrides: Partial<CommerceCollectionListItem> = {},
): CommerceCollectionListItem => ({
  id: 'col-1',
  name: 'Summer',
  slug: 'summer',
  productIds: ['prod-1', 'prod-2'],
  createDate: '2026-07-01T00:00:00.000Z',
  updateDate: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

describe('toggleProductInCollectionMembership', () => {
  it('adds the product id when it is not currently a member', () => {
    const result = toggleProductInCollectionMembership(collection(), 'prod-3');
    expect(result).toEqual(['prod-1', 'prod-2', 'prod-3']);
  });

  it('removes the product id when it is currently a member', () => {
    const result = toggleProductInCollectionMembership(collection(), 'prod-1');
    expect(result).toEqual(['prod-2']);
  });

  it('is a no-op-safe toggle (add then remove returns the original set)', () => {
    const added = toggleProductInCollectionMembership(collection(), 'prod-3');
    const removed = toggleProductInCollectionMembership(
      collection({ productIds: added }),
      'prod-3',
    );
    expect(removed).toEqual(['prod-1', 'prod-2']);
  });

  it('never mutates the original productIds array', () => {
    const original = collection();
    const originalIds = [...original.productIds];
    toggleProductInCollectionMembership(original, 'prod-1');
    toggleProductInCollectionMembership(original, 'prod-3');
    expect(original.productIds).toEqual(originalIds);
  });
});
