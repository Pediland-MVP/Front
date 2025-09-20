// src/types/api.ts

export interface PageMeta {
  currentPage: number;
  itemsPerPage: number;
  itemCount: number;
  totalItems: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: ReadonlyArray<T>;
  meta: Readonly<PageMeta>;
}
