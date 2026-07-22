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
  optionValueIds: string[];
  media?: CommerceVariantMediaAssignment; // populated lazily by Task 6, not in the GET detail
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
}

export interface CommerceProductMedia {
  id: string;
  productId: string;
  fileId: number;
  type: CommerceMediaType;
  position: number;
  alt: string | null;
  url: string; // resolved by the upload response / GET media list — see Task 4
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
