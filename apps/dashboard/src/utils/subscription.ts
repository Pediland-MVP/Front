import { Subscription } from '@/types/subscriptions/subscriptions';
import { SubscriptionStatusEnum } from '@/types/subscriptions/enums/subscriptionStatus.enum';

const CREDIT_TYPE = 'credit';

export function getRemainingDays(expire: string, now: Date = new Date()): number {
  const diff = new Date(expire).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
}

export function getActiveSubscriptions(subs?: Subscription[]): Subscription[] {
  return subs?.filter((s) => s.status === SubscriptionStatusEnum.ACTIVE) ?? [];
}

// Workspace-wide free-trial subscription — never page-bound.
export function getActiveCreditSubscription(subs?: Subscription[]): Subscription | undefined {
  return getActiveSubscriptions(subs).find((s) => s.type === CREDIT_TYPE);
}

// All paid/time subscriptions, bound or not — used for workspace-level "days remaining" totals.
export function getActiveNonCreditSubscriptions(subs?: Subscription[]): Subscription[] {
  return getActiveSubscriptions(subs).filter((s) => s.type !== CREDIT_TYPE);
}

// Paid subscriptions bound to a specific Instagram page.
export function getActivePageSubscriptions(subs?: Subscription[]): Subscription[] {
  return getActiveNonCreditSubscriptions(subs).filter((s) => s.instagramId);
}

// Paid subscriptions that are ACTIVE but not yet bound to a page (pool edge case).
export function getUnboundActiveSubscriptions(subs?: Subscription[]): Subscription[] {
  return getActiveNonCreditSubscriptions(subs).filter((s) => !s.instagramId);
}

// True only while the workspace's sole coverage is the unconsumed free credit trial —
// drives the "hide upgrade nudges until credit is used" business rule everywhere it appears.
export function hasOnlyFreeCredit(subs?: Subscription[]): boolean {
  return (
    Boolean(getActiveCreditSubscription(subs)) && getActiveNonCreditSubscriptions(subs).length === 0
  );
}
