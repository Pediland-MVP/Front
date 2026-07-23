export type CommerceProductStatus = 'draft' | 'active' | 'archived';
export type CommerceProductKind = 'physical' | 'digital';
export type CommerceOptionStyle = 'dropdown' | 'button' | 'color';
export type CommerceMediaType = 'image' | 'video';
export type CommerceStockMovementReason =
  | 'order'
  | 'refund'
  | 'manual'
  | 'import'
  | 'migration'
  | 'adjustment';

export interface CommerceProductListItem {
  id: string;
  title: string;
  slug: string;
  status: CommerceProductStatus;
  kind: CommerceProductKind;
  variantCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  needsStockReview: boolean;
  updateDate: string;
  coverMediaUrl: string | null;
}

export interface CommerceOptionValueDetail {
  id: string;
  value: string;
  colorHex: string | null;
  position: number;
}

export interface CommerceOptionDetail {
  id: string;
  name: string;
  style: CommerceOptionStyle;
  position: number;
  values: CommerceOptionValueDetail[];
}

export interface CommerceVariantMediaAssignment {
  selectedMediaIds: string[];
  coverMediaId: string | null;
}

export interface CommerceVariantDetail {
  id: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  salePrice: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  optionSignature: string;
  position: number;
  isActive: boolean;
  trackInventory: boolean;
  allowBackorder: boolean;
  weight: number | null;
  onHand: number;
  // Always present in the GET detail response (Back commit 56276b7a) — null means no
  // threshold has ever been set for this variant.
  lowStockThreshold: number | null;
  optionValueIds: string[];
  // Always present in the GET detail response (Back commit 869261f8) — {selectedMediaIds: [],
  // coverMediaId: null} means "no override, falls back to the product's implicit cover".
  media: CommerceVariantMediaAssignment;
}

export interface CommerceProductDetail {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  slug: string;
  status: CommerceProductStatus;
  kind: CommerceProductKind;
  categoryId: string | null;
  needsStockReview: boolean;
  shippingCost: number;
  createDate: string;
  updateDate: string;
  options: CommerceOptionDetail[];
  variants: CommerceVariantDetail[];
  media: CommerceProductMedia[];
}

// Matches the backend's CommerceProductMediaDetailDto exactly (Back commit dd45d1fc) —
// there is no dedicated GET media-list route; this array comes back inline on
// GET /commerce/products/:id (CommerceProductDetail.media above). No productId/fileId:
// those are internal backend fields, never exposed once the url is resolved server-side.
export interface CommerceProductMedia {
  id: string;
  type: CommerceMediaType;
  position: number;
  alt: string | null;
  url: string;
  posterUrl: string | null; // resolved poster frame for video media, else null
}

export interface CommerceCategory {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  parentId: string | null;
  position: number;
}

export interface CommerceCategoryNode extends CommerceCategory {
  children: CommerceCategoryNode[];
}

export interface CommerceCollectionListItem {
  id: string;
  name: string;
  slug: string;
  productIds: string[];
  createDate: string;
  updateDate: string;
}

export interface CommerceStockMovement {
  id: string;
  variantId: string;
  locationId: string;
  delta: number;
  reason: CommerceStockMovementReason;
  referenceId: string | null;
  actorId: string | null;
  createDate: string;
}

export interface PaginatedResult<T> {
  items: T;
  meta: {
    currentPage: number;
    itemCount: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}
