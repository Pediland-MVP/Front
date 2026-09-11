export namespace CityNamespace {
  export type City = ICity;
  export type GET = ICity[];
}

export interface ICity {
  id: number;
  name: string;
  slug: string;
  /** Which province the city belongs to. `GET /cities` returns it on every row. */
  provinceId: number;
}
