'use client';

import { ProductEditorPage } from '@/components/Commerce/ProductEditor/ProductEditorPage';

// The client boundary. It exists only so the awaited id can cross into a `'use client'` tree —
// the editor is entirely client-side (SWR, react-hook-form, object URLs), so there is nothing
// for the server to render.
export default function Product({ id }: { id: string }) {
  return (
    <div className="_edit-product flex flex-1 flex-col">
      <ProductEditorPage mode="edit" productId={id} />
    </div>
  );
}
