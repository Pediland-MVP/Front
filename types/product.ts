export namespace ProductNamespace {
  export interface GET {
    items: ProductItem[];
    meta: Meta;
  }

  export type Product = ProductItem;
  export type Products = ProductItem[];
  export type PublicProduct = ProductItem;
}

export interface ProductItem {
  id: string;
  createDate: string;
  updateDate: string;
  title: string;
  price: number;
  discountPrice: number | null;
  description: string;
  quantity?: number;
  images: Image[];
  isInfinite: boolean;
  isDigital: boolean;
  productVariations: {
    id: string;
    createDate: string;
    updateDate: string;
    variationValues: {
      id: number;
      createDate: string;
      updateDate: string;
      value: string;
      label: string
      colorHex: string | null;
      variationTypeId: number;
    }[];
  }[] | null;
  fields: {
    id: string;
    label: string;
    type: string;
    isRequired: boolean;
    options?: any[];
  }[];
}

export interface Image {
  id: number;
  url: string;
}

export interface Meta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
