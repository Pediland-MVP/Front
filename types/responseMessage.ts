export type RES_CODES = 'PAID_FREE' | 'PAID_BY_GATEWAY' | 'PAYMENT_LINK_GENERATED'

export interface IResponseMessage<T> {
    message: 'Created' | 'OK' | 'Updated' | string&{},
    statusCode: 200 | 201 | number&{},
    code: RES_CODES,
    data?: T | any
}