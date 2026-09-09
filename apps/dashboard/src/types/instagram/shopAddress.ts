export interface IShopAddress {
  id: string;
  address: string | null;
  postalcode: string | null;
  phone: string | null;
  shippingMethod: string | null;
  city: {
    id: number;
    name: string;
    province: { id: number; name: string } | null;
  } | null;
}
