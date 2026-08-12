'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { getUnboundActiveSubscriptions } from '@/utils/subscription';

/**
 * Set on `/connect` once the user has answered the unbound-plan question with "continue
 * with this one". Without it, `SetupInstagramDialog`'s continue button — which now sends
 * the user to `/connect` rather than straight into OAuth — would land them on a page whose
 * gate is still unanswered, reopening the same dialog forever.
 */
export const CONTINUE_WITH_PLAN_PARAM = 'continueWithPlan';

/** Where the dialog's "ادامه با همین اشتراک" button goes, from any surface. */
export const CONTINUE_WITH_PLAN_HREF = `/connect?${CONTINUE_WITH_PLAN_PARAM}=1`;

/**
 * Decides whether adding another Instagram account may go straight to the OAuth
 * handshake, or has to pass through `SetupInstagramDialog` first.
 *
 * Both entry points into that journey — `/connect` and the "افزودن اکانت" button on
 * `/settings/instagram` — ask this hook, so the two can never drift apart on the rule.
 *
 * Two independent reasons to stop at the dialog:
 *
 * - `needsSubscriptionSetup` — the workspace has no unused coverage at all, so the page
 *   about to be connected would have nothing to run on. The dialog sells a fitting plan.
 * - `hasUnboundPlan` — the workspace holds a paid plan bought but never attached to a
 *   page. That makes `hasAvailableSubscriptionSlot` true, which would otherwise wave the
 *   user through, but the flag is tier-blind: it cannot know whether the plan's follower
 *   range fits the page being added, because that page is not connected yet. The real
 *   check runs server-side in `bindOnConnect` *after* the OAuth round-trip, and a mismatch
 *   throws SUBSCRIPTION_NOT_COMPATIBLE_WITH_FOLLOWER_COUNT and rolls everything back —
 *   leaving the user with a toast and no way to act on it. So show the plan first and let
 *   them choose: continue with it, or buy one that fits.
 *
 * `getUnboundActiveSubscriptions` excludes credit by design, which is right: credit
 * coverage is workspace-wide and follower-count-blind, so it can never mismatch and needs
 * no decision — it goes straight to OAuth.
 *
 * @param hasInstagram Whether the workspace already has at least one connected account.
 *   Callers source this differently (`/connect` from `useUser`, settings from the accounts
 *   list), so it stays a parameter. The first account is never gated.
 * @param options.unboundPlanAccepted The user already answered the unbound-plan question
 *   with "continue with this one" (see `CONTINUE_WITH_PLAN_HREF`). Clears *only* that
 *   reason — a workspace with no coverage at all still has nothing to run on, so
 *   `needsSubscriptionSetup` keeps gating regardless.
 */
export function useAddInstagramGate(
  hasInstagram: boolean,
  { unboundPlanAccepted = false }: { unboundPlanAccepted?: boolean } = {},
) {
  const { workspaceId } = usePermissions();
  const { workspaces, isLoading: isWorkspacesLoading } = useWorkspaces();
  const { subscriptions, isLoading: isSubscriptionsLoading } = useSubscriptionStore();

  // Sourced from GET /workspaces (keyed by real membership), not GET /users/me (keyed by
  // the workspaceId baked into the JWT access token, which can go stale relative to the
  // workspace actually selected in the UI — see knowledge/updates for the incident this
  // fixed). A workspace not yet loaded/matched is treated as "no slot" (safer default).
  const currentWorkspace = workspaces.find((w) => w.id === workspaceId);
  const hasAvailableSubscriptionSlot = currentWorkspace?.hasAvailableSubscriptionSlot ?? false;

  const needsSubscriptionSetup = hasInstagram && !hasAvailableSubscriptionSlot;
  const hasUnboundPlan = hasInstagram && getUnboundActiveSubscriptions(subscriptions).length > 0;
  const unboundPlanNeedsAnswer = hasUnboundPlan && !unboundPlanAccepted;

  return {
    currentWorkspace,
    hasAvailableSubscriptionSlot,
    needsSubscriptionSetup,
    hasUnboundPlan,
    requiresSetupDialog: needsSubscriptionSetup || unboundPlanNeedsAnswer,
    // Both inputs decide the gate, and both default to "no slot" / "no unbound plan" while
    // in flight — which is the *ungated* answer for `hasUnboundPlan`. Callers that can hold
    // the button back should wait on this rather than act on a half-loaded answer.
    isLoading: isWorkspacesLoading || isSubscriptionsLoading,
  };
}
