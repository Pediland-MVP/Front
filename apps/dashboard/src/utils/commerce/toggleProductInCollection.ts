import { CommerceCollectionListItem } from '@/types/commerce';

/** Returns the new FULL productIds[] to PUT back — this replaces the collection's entire
 * membership, it does not append/remove server-side. Caller must PUT the result. */
export function toggleProductInCollectionMembership(
  collection: CommerceCollectionListItem,
  productId: string,
): string[] {
  const isMember = collection.productIds.includes(productId);
  return isMember
    ? collection.productIds.filter((id) => id !== productId)
    : [...collection.productIds, productId];
}
