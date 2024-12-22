export type ERROR_CODES =
    | 'USER_NOT_FOUND'
    | 'PASSWORD_INVALID'
    | 'PRODUCT_NOT_FOUND'
    | 'PRODUCT_OUT_OF_STOCK'
    | 'ORDER_NOT_FOUND'
    | 'ORDER_EXPIRED'
    | 'ORDER_SHOP_IS_NOT_VALID'
    | 'ORDER_INVALID'
    | 'ORDER_CARD_TO_CARD_NOT_UPLOADED'
    | 'ORDER_QUANTITY_IS_ZERO'
    | 'LEAD_INSTAGRAM_NOT_FOUND';
export interface ExceptionMessage {
    message: string;
    statusCode: 400 | 401 | 404 | 500;
    code: ERROR_CODES;
    error:
        | 'Not Found'
        | 'Bad Request'
        | 'Internal Server Error'
        | (string & {});
}

