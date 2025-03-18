import { IProductVariationTypes } from "./productVariationTypes";
import { IProductVariationValues } from "./productVariationValues";

export namespace ProductVariationNamespace {
    export namespace GET { 
        export type ProductVariationValues = IProductVariationValues
        export type ProductVariationTypes = IProductVariationTypes
    }
    export namespace POST { }
    export namespace PUT { }
    export namespace DELETE { }
}