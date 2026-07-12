'use client';

import { UsersThreeIcon } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';

interface PlanTierBadgeProps {
  // The plan the subscription belongs to; `name` is the tier label the user bought
  // (e.g. "۱K تا ۲۵K فالور" or "هدیه رایگان").
  plan?: { name: string };
  className?: string;
}

/**
 * Shows the plan tier the user bought as a pill — the same human label used in the buy
 * flow — instead of a raw min/max follower range. Renders nothing when the plan is absent
 * (older API responses that don't join `planDuration.plan`).
 */
export function PlanTierBadge({ plan, className }: PlanTierBadgeProps) {
  if (!plan?.name) return null;

  return (
    <span
      className={cn(
        'text-primary inline-flex w-fit items-center gap-1.5 rounded-full border border-violet-200 bg-gradient-to-l from-violet-50 to-blue-50 px-2.5 py-1 text-xs font-semibold shadow-sm shadow-violet-100',
        className,
      )}
    >
      <UsersThreeIcon size={14} weight="fill" className="shrink-0" />
      {plan.name}
    </span>
  );
}
