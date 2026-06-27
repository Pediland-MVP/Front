// src/constants/subscription-status.ts

import { SubscriptionStatusEnum } from '@/types/subscription';

export const subscriptionStatusToColor: Record<
  SubscriptionStatusEnum,
  'blue' | 'yellow' | 'orange' | 'gray' | 'green' | 'red' | 'purple'
> = {
  [SubscriptionStatusEnum.ACTIVE]: 'green',
  [SubscriptionStatusEnum.EXPIRED]: 'gray',
  [SubscriptionStatusEnum.CANCELLED]: 'red',
  [SubscriptionStatusEnum.PENDING]: 'yellow',
  [SubscriptionStatusEnum.RESERVED]: 'blue',
  [SubscriptionStatusEnum.FAILED]: 'red',
  [SubscriptionStatusEnum.PEND_FOR_ACTIVATOR]: 'purple',
};

export const subscriptionStatusLabels: Record<SubscriptionStatusEnum, string> = {
  [SubscriptionStatusEnum.ACTIVE]: 'فعال',
  [SubscriptionStatusEnum.EXPIRED]: 'منقضی شده',
  [SubscriptionStatusEnum.CANCELLED]: 'لغو شده',
  [SubscriptionStatusEnum.PENDING]: 'در انتظار',
  [SubscriptionStatusEnum.RESERVED]: 'رزرو شده',
  [SubscriptionStatusEnum.FAILED]: 'ناموفق',
  [SubscriptionStatusEnum.PEND_FOR_ACTIVATOR]: 'اتصال',
};
