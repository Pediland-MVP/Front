'use client';

import { LayoutCard } from '@/components/Layout/LayoutCard';
import { OrdersListPage } from '@/components/Commerce/Orders/OrdersListPage';

export default function Page() {
  return (
    /**
     * `md:overflow-hidden` hands scrolling to `OrdersListPage`'s middle band on desktop, which is
     * what keeps the filter bar and the pager pinned instead of scrolling away with the grid.
     *
     * Deliberately NOT applied below `md`. `SidebarInset` is `overflow-y-auto` on mobile and only
     * `md:overflow-hidden` (see its own comment in `packages/ui`), i.e. the phone is meant to
     * scroll at the inset level. Pinning both bands there too would leave roughly one card visible
     * between a ~200px filter header and the pager on a short screen.
     *
     * `LayoutCard` keeps its base `overflow-y-auto` because tailwind-merge treats a `md:` utility
     * as a separate group from the unprefixed one, so only the desktop value is replaced.
     */
    <LayoutCard className="_products md:overflow-hidden">
      <OrdersListPage />
    </LayoutCard>
  );
}
