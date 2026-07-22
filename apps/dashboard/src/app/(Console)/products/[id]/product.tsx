'use client';

import { ProductEditorPage } from '@/components/Commerce/ProductEditor/ProductEditorPage';

export default function Product({ id }: { id: string }) {
  return (
    <div className="_edit-product overflow-auto">
      <ProductEditorPage mode="edit" productId={id} />
    </div>
  );
}
