import { Subscription } from '@/types/subscriptions/subscriptions';
import { SubscriptionStatusEnum } from '@/types/subscriptions/enums/subscriptionStatus.enum';

export function getRemainingDays(expire: string, now: Date = new Date()): number {
  const diff = new Date(expire).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
}

export function getActiveSubscriptions(subs?: Subscription[]): Subscription[] {
  return subs?.filter((s) => s.status === SubscriptionStatusEnum.ACTIVE) ?? [];
}

// Paid subscriptions bound to a specific Instagram page.
export function getActivePageSubscriptions(subs?: Subscription[]): Subscription[] {
  return getActiveSubscriptions(subs).filter((s) => s.instagramId);
}

// Paid subscriptions that are ACTIVE but not yet bound to a page (pool edge case).
export function getUnboundActiveSubscriptions(subs?: Subscription[]): Subscription[] {
  return getActiveSubscriptions(subs).filter((s) => !s.instagramId);
}
