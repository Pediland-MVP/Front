export interface IProductAttributes {
    items: Item[];
    meta:  Meta;
}

export interface Item {
    id:         number;
    createDate: Date;
    updateDate: Date;
    isLocked:   boolean;
    title:      string;
    style:      string;
}

export interface Meta {
    itemCount:    number;
    currentPage:  number;
    itemsPerPage: number;
    totalItems:   number;
    totalPages:   number;
}
