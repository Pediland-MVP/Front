export type ICanQuantityUpResponse = {
    product: {
        id: string;
        createDate: string;
        updateDate: string;
        title: string;
        price: number;
        discountPrice: number | null;
        quantity: number;
        status: boolean;
        isInfinite: boolean;
        description: string;
        isDigital: boolean;
        images: {
            id: number;
            createDate: string;
            updateDate: string;
            mimeType: string;
            name: string;
            url: string;
            tubmnailUrl: string;
            size: number;
            key: string;
        }[];
    };
    status: boolean;
    next: boolean;
}[];
