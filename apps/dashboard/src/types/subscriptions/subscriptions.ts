import { SubscriptionStatusEnum } from './enums/subscriptionStatus.enum';

export interface ISubscriptions {
  items: Subscription[];
  meta: Meta;
}

export interface Subscription {
  activator: string;
  createDate: string;
  expire: string;
  id: string;
  instagramId: string | null;
  planDuration: PlanDuration;
  planDurationId: number;
  status: SubscriptionStatusEnum;
  updateDate: string;
  userId: string;
}

interface PlanDuration {
  id: number;
  createDate: string;
  updateDate: string;
  name: string;
  price: number;
  durationDays: number;
  planId: number;
  plan?: Plan;
}

interface Plan {
  id: number;
  name: string;
  minFollowers: number;
  maxFollowers: number;
}

interface Meta {
  itemCount: number;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}
