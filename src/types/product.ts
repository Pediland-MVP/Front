import { ButtonTypeEnum } from "./buttons.enum";
import { ProductFieldTypeEnum } from "./product.enum";

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
  price: number | null;
  status: boolean;
  discountPrice: number | null;
  description: string;
  quantity?: number;
  images: Image[];
  isInfinite: boolean;
  isDigital: boolean;
  productVariations: ProductVariation[];
  orderButtonText: string;
  orderProcessText: string;
  shippingCost: number;
  fields: {
    id: string;
    label: string;
    type: ProductFieldTypeEnum;
    isRequired: boolean;
    options?: any[];
    [key: string]: string | boolean | number | (any[] | undefined) | null;
  }[];
  buttons?: {
    id: string;
    type: ButtonTypeEnum;
    text: string;
    value?: string;
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

export interface ProductVariation {
  id: string;
  createDate: string;
  updateDate: string;
  attributes: Attribute[];
}

export interface Attribute {
  id: number;
  title: string;
  style: "button" | "color";
  attributeValues: AttributeValue[];
}

export interface AttributeValue {
  id: number;
  createDate: string;
  updateDate: string;
  value: string;
  label: string;
  colorHex: string | null;
  attributeId: number;
}
