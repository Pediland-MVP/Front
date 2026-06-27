import { IProductAttributes } from './productAttributes';
import { IProductAttributeValues } from './productAttributeValues';

export namespace ProductVariationNamespace {
  export namespace GET {
    export type ProductAttributeValues = IProductAttributeValues;
    export type ProductAttributes = IProductAttributes;
  }
  export namespace POST {}
  export namespace PUT {}
  export namespace DELETE {}
}
