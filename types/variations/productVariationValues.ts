export interface IProductVariationValues {
    items: Item[];
    meta:  Meta;
}

export interface Item {
    id:              number;
    createDate:      Date;
    updateDate:      Date;
    value:           string;
    label:           string;
    colorHex:        null | string;
    variationTypeId: number;
}

export interface Meta {
    itemCount:    number;
    currentPage:  number;
    itemsPerPage: number;
    totalItems:   number;
    totalPages:   number;
}
