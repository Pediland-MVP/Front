import { ORDER_PAYMENT_METHODS } from "./order.enum";
import { ORDER_STATUS } from "./order.namespace";
export interface IOrders {
  items: Item[];
  meta: Meta;
}

interface Item {
  id: string;
  createDate: string;
  updateDate: string;
  startPaymentDate: string;
  status: ORDER_STATUS;
  from: "instagram";
  step: number;
  paymentMethod: ORDER_PAYMENT_METHODS;
  orderCardToCard: OrderCardToCard;
  orderProducts: OrderProduct[];
  orderShipping: OrderShipping;
  lead: OrdersLead;
  leadId: string;
  instagram: Instagram;
  instagramId: string;
  secret: string;
  productFieldValues?: ProductFieldValue[]
}

interface Instagram {
  id: string;
}

interface OrdersLead {
  id: string;
  createDate: string;
  updateDate: string;
  firstname: string;
  lastname: null;
  profilePic: string;
  contact: OrderShipping;
  leadInstagram: LeadInstagram;
}

interface OrderShipping {
  id: string;
  createDate: string;
  updateDate: string;
  firstname: string;
  lastname: string;
  mobile: string;
  email: null;
  country: null;
  postalcode: string;
  address: string;
  gender?: null;
  birthDate?: null;
  cityId: number;
  orderId?: null;
  city?: City;
}

interface City {
  id: number;
  name: string;
  slug: string;
  province?: City;
  tel_prefix?: string;
}

interface LeadInstagram {
  id: string;
  createDate: string;
  updateDate: string;
  ASID: string;
  isAdmin: boolean;
  lastUpdate: string;
  name: string;
  username: string;
  isVerifiedUser: boolean;
  followerCount: number;
  isUserFollowBusiness: boolean;
  isBusinessFollowUser: boolean;
  PSID: null;
  leadId: string;
  profilePicture: ProfilePicture;
}

interface ProfilePicture {
  id: number;
  createDate: string;
  updateDate: string;
  mimeType: string;
  name: string;
  url: string;
  tubmnailUrl: string;
  size: number;
  key: string;
}
interface OrderCardToCard {
  id: string;
  createDate: string;
  updateDate: string;
  url: string;
  key: string;
}

interface OrderProduct {
  id: string;
  createDate: string;
  updateDate: string;
  price: number;
  discountPrice: number | null
  quantity: number;
  product: Product;
  shippingCost: number | null
  attributeValues: {
    id: number;
    createDate: string;
    updateDate: string;
    value: string;
    label: string;
    colorHex: string | null;
    attributeId: number;
  }[];
}

interface Product {
  id: string;
  createDate: string;
  updateDate: string;
  title: string;
  price: number;
  discountPrice: number;
  quantity: number;
  status: boolean;
  isInfinite: boolean;
  description: string;
  isDigital: boolean;
  images: Image[];
}

interface Image {
  id: number;
  createDate: string;
  updateDate: string;
  mimeType: string;
  name: string;
  url: string;
  tubmnailUrl: string;
  size: number;
  key: string;
}

interface Meta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

type ProductFieldValue = {
  id: string;
  fieldId: string;
  value: string;
  field: {
    id: string;
    createDate: string;
    updateDate: string;
    deleteDate: string | null;
    label: string;
    type: string;
    isRequired: boolean;
    priority: number;
  };
};

