export type ERROR_CODES =
    | 'USER_NOT_FOUND'
    | 'PASSWORD_INVALID'
    | 'PRODUCT_NOT_FOUND'
    | 'PRODUCT_OUT_OF_STOCK'
    | 'ORDER_NOT_FOUND'
    | 'ORDER_EXPIRED'
    | 'ORDER_SHOP_IS_NOT_VALID'
    | 'ORDER_INVALID'
    | 'ORDER_QUANTITY_IS_ZERO'
    | 'ORDER_CARD_TO_CARD_NOT_UPLOADED'
    | 'LEAD_INSTAGRAM_NOT_FOUND'
    | 'NO_INSTAGRAM'
    | 'CITY_INVALID'
    | 'COMMENT_NOT_FOUND'
    | 'CONTENT_TEXT_REQUIRED'
    | 'CONTENT_FILE_REQUIRED'
    | 'CONTENT_INSTAGRAMPOST_REQUIRED'
    | 'CONTENT_AUDIO_REQUIRED'
    | 'CONTENT_VIDEO_REQUIRED'
    | 'CONTENT_IMAGE_REQUIRED'
    | 'FILE_NOT_FOUND'
    | 'CONDITION_IS_ALREADY_EXIST'
    | 'CONSENT_TEXT_REQUIRED'
    | 'USER_DATA_TEXT_REQUIRED'
    | 'REMINDER_TIME_REQUIRED'
    | 'CARD_TO_CARD_USER_HAVE_NOT';


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

