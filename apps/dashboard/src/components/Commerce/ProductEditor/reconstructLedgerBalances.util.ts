import { CommerceStockMovement } from '@/types/commerce';

export interface MovementWithBalance extends CommerceStockMovement {
  balanceAfter: number;
}

// `movements` must be DESC-ordered by createDate (the API's own order). `currentOnHand` is
// the variant's live on-hand count. Walking newest→oldest, this row's "balance after" is
// whatever the running balance was BEFORE we subtract this row's delta for the next
// (older) row.
export function reconstructLedgerBalances(
  movements: CommerceStockMovement[],
  currentOnHand: number,
): MovementWithBalance[] {
  let running = currentOnHand;
  return movements.map((m) => {
    const balanceAfter = running;
    running -= m.delta;
    return { ...m, balanceAfter };
  });
}
