export type RES_CODES = 'PAID_FREE' | 'PAID_BY_GATEWAY' | 'PAYMENT_LINK_GENERATED' | 'ORDER_CREATED' | 'CONTACT_UPDATED'

export interface IResponseMessage<T = undefined> {
    message: 'Created' | 'OK' | 'Updated' | string&{},
    statusCode: 200 | 201 | number&{},
    code: RES_CODES,
    data: T extends undefined ? any | undefined : T
}
