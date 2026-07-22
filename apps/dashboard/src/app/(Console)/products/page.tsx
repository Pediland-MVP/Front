'use client';

import { LayoutCard } from '@/components/Layout/LayoutCard';
import { ProductListPage } from '@/components/Commerce/ProductList/ProductListPage';

export default function Page() {
  return (
    <LayoutCard className="_products">
      <ProductListPage />
    </LayoutCard>
  );
}
