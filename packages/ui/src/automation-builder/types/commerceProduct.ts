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
    // Variant products span a range, so the list route returns both bounds rather than one
    // `price` like the legacy `ProductNamespace.Product` the فروش picker reads. Either can be
    // null (a product with no priced variant yet), so the picker must not assume a number.
    minPrice: number | null;
    maxPrice: number | null;
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
