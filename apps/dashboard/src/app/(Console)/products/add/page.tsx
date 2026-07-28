'use client';

import { LayoutPage } from '@/components/Layout/LayoutPage';
import { ProductEditorPage } from '@/components/Commerce/ProductEditor/ProductEditorPage';

export default function Page() {
  return (
    <LayoutPage className="_add-product">
      <ProductEditorPage mode="create" />
    </LayoutPage>
  );
}
