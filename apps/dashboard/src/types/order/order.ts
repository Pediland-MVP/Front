import { GENDERS_ENUM } from '@/constants/gender.constant';
import { ORDER_STATUS } from './order.namespace';
import { ORDER_PAYMENT_METHODS } from './order.enum';
import { City } from '../user';

export interface IOrder {
  createDate: string;
  from: 'instagram';
  id: string;
  instagram: Instagram;
  instagramId: string;
  lead: Lead;
  leadId: string;
  orderCardToCard: OrderCardToCard;
  orderProducts: OrderProduct[];
  orderShipping: OrderShipping;
  paymentMethod: ORDER_PAYMENT_METHODS;
  productFieldValues: [];
  startPaymentDate: string;
  status: ORDER_STATUS;
  step: number;
  updateDate: string;
  secret: string;
}

interface OrderShipping {
  id: string;
  createDate: string;
  updateDate: string;
  address: string;
  city: City;
  country: string;
  postalcode: string;
  state: string;
}

interface Instagram {
  id: string;
  createDate: Date;
  updateDate: Date;
  igTokenExpireDate: Date;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  igId: string;
  instagramId: string;
  facebookAccountId: null;
  facebookPageId: null;
  name: string;
  firstname: string;
  lastname: string | null;
  email: string | null;
  username: string;
  profileUrl: string | null;
  profilePictureUrl: string;
  allowFirstLeads: boolean;
}

interface Lead {
  contact: Contact;
  contactId: string;
  createDate: Date;
  firstname: string;
  id: string;
  instagramId: string;
  lastname: string | null;
  leadInstagram: Instagram;
  profilePic: string;
  updateDate: Date;
}

interface Contact {
  id: string;
  createDate: Date;
  updateDate: Date;
  firstname?: string;
  lastname?: string;
  mobile?: string;
  email?: string;
  country?: string;
  postalcode?: string;
  address?: string;
  city?: string;
  gender?: GENDERS_ENUM;
  birthDate?: string;
  state?: string;
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
  product: Product;
  quantity: number;
  discountPrice: number;
  price: number;
}

interface Product {
  id: string;
  createDate: Date;
  updateDate: Date;
  title: string;
  price: number;
  quantity: number;
  status: boolean;
  isInfinite: boolean;
  description: string;
  isDigital: boolean;
  images: Image[];
}

interface Image {
  id: number;
  createDate: Date;
  updateDate: Date;
  memeType: string;
  name: string;
  url: string;
  tubmnailUrl: string;
  size: number;
  key: string;
}

enum ORDER_FROM {
  INSTAGRAM = 'instagram',
}

interface IOrderGet {
  items: Item[];
  meta: GetMeta;
}

interface Item {
  id: string;
  secret: string;
  createDate: Date;
  updateDate: Date;
  status: ORDER_STATUS;
  from: ORDER_FROM;
  paymentMethod: ORDER_PAYMENT_METHODS;
  orderCardToCard: GetOrderCardToCard;
  orderProducts: GetOrderProduct[];
  lead: GetLead;
  instagram: GetInstagram;
}
interface GetInstagram {
  id: string;
}

interface GetLead {
  id: string;
  createDate: Date;
  updateDate: Date;
  firstname: string;
  lastname: null;
  profilePic: string;
  contact: GetContact;
}

interface GetContact {
  id: string;
  createDate: Date;
  updateDate: Date;
  firstname: string;
  lastname: string;
  mobile: string;
  email: string;
  country: string;
  state: string;
  postalcode: string;
  address: string;
  city: string;
  gender: string;
  birthDate: Date;
}

interface GetOrderCardToCard {
  id: string;
  createDate: Date;
  updateDate: Date;
  url: string;
  key: string;
}

interface GetOrderProduct {
  id: string;
  createDate: Date;
  updateDate: Date;
  quantity: number;
  product: GetProduct;
}

interface GetProduct {
  id: string;
  createDate: Date;
  updateDate: Date;
  title: string;
  price: number;
  quantity: number;
  status: boolean;
  isInfinite: boolean;
  description: string;
  isDigital: boolean;
  images: GetProductImage[];
}

interface GetProductImage {
  id: number;
  createDate: Date;
  updateDate: Date;
  memeType: string;
  name: string;
  url: string;
  tubmnailUrl: string;
  size: number;
  key: string;
}

interface GetMeta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
