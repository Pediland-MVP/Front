export interface IProductAttributeValues {
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
    attributeId: number;
}

export interface Meta {
    itemCount:    number;
    currentPage:  number;
    itemsPerPage: number;
    totalItems:   number;
    totalPages:   number;
}
