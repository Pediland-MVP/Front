// packages/ui/src/automation-builder/types/commerceProduct.ts
// Duplicated (not imported) from apps/dashboard/src/types/commerce.ts's
// `CommerceProductListItem`/`PaginatedResult` — mirrors the existing `types/product.ts`
// convention in this same folder (that file's own header comment explains why: packages/ui
// can't depend on an app-only type, and only the shape `BuyInDirectContent`'s picker needs
// is duplicated here, not the whole commerce type surface).
export namespace CommerceProductNamespace {
  export interface Item {
    id: string;
    title: string;
    coverMediaUrl: string | null;
  }

  export interface GET {
    items: Item[];
    meta: {
      currentPage: number;
      itemCount: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
    };
  }
}
