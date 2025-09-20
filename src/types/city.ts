export namespace CityNamespace {
    export type City = ICity
    export type GET = ICity[]
}

export interface ICity {
    id:   number;
    name: string;
    slug: string;
}
