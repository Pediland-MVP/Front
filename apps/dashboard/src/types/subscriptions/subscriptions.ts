import { SubscriptionStatusEnum } from './enums/subscriptionStatus.enum';

export interface ISubscriptions {
  items: Subscription[];
  meta: Meta;
}

interface Subscription {
  activator: string;
  createDate: string;
  credit: number;
  expire: string;
  id: string;
  planDuration: PlanDuration;
  planDurationId: number;
  status: SubscriptionStatusEnum;
  type: string;
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
}

interface Meta {
  itemCount: number;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}
