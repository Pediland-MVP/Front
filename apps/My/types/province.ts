
export  namespace ProvinceNamespace {
    export type Province = IProvince;
    export type GET = Province[]
}

export interface IProvince {
    id:         number;
    name:       string;
    slug:       string;
    tel_prefix: string;
}
