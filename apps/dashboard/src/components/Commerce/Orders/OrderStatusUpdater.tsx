'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import type { CommerceOrderStatus, OrderView } from '@/types/commerceOrders';

import { CancelOrderDialog } from './dialogs/CancelOrderDialog';
import { ConfirmActionDialog } from './dialogs/ConfirmActionDialog';
import { RejectPaymentDialog } from './dialogs/RejectPaymentDialog';
import { ShipOrderDialog } from './dialogs/ShipOrderDialog';
import {
  actionForTransition,
  canMarkPaid,
  targetStatusesFor,
  type OrderActionName,
} from './orderTransitions';

interface OrderStatusUpdaterProps {
  order: OrderView;
  /** Identical contract to the `OrderActions` this replaces: resolves `true` when the write
   *  landed, `false` when it failed and the page has already toasted. `trackingUrl` is carried
   *  only by `ship` -- see `runAction`'s "forward only what was passed" comment. */
  onAction: (
    name: OrderActionName | 'markPaid',
    reason?: string,
    trackingUrl?: string,
  ) => Promise<boolean>;
  disabled?: boolean;
}

/**
 * One status select and one «بروزرسانی» button, in place of six sibling action buttons.
 *
 * The select offers only LEGAL targets, so a transition the API would refuse can never be
 * submitted. The confirmation dialog is chosen by `actionForTransition`, which is what makes
 * «لغو شده» ask for a buyer-facing reason from `awaiting_review` (reject) but warn about
 * restocking from `processing`/`sending` (cancel).
 *
 * `markPaid` deliberately sits OUTSIDE the select: it is settlement, not status. Its only
 * backend guard is `paidAt IS NULL`, so gating it on status would hide it where it is legal --
 * above all on a COMPLETED cash-on-delivery order, which is the primary case it exists for.
 */
export function OrderStatusUpdater({ order, onAction, disabled }: OrderStatusUpdaterProps) {
  const t = useTranslations('Commerce.Orders');
  const { can } = usePermissions();

  const [draft, setDraft] = useState<CommerceOrderStatus>(order.status);
  const [pendingAction, setPendingAction] = useState<OrderActionName | null>(null);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // The order can move under the page -- the buyer's DM can promote it, another seat can approve
  // it -- and `OrderDetailPage` revalidates on `COMMERCE_ORDER_STATUS_CHANGED`. When it does, a
  // draft still pointing at the old target would submit a transition that no longer exists.
  useEffect(() => {
    setDraft(order.status);
  }, [order.status]);

  if (!can('order:manage')) return null;

  const targets = targetStatusesFor(order);
  const isTerminal = targets.length === 0;
  const isDisabled = disabled || busy;
  const pendingResolved = draft === order.status ? null : actionForTransition(order.status, draft);

  const runAction = async (
    name: OrderActionName | 'markPaid',
    reason?: string,
    trackingUrl?: string,
  ) => {
    setBusy(true);
    try {
      // Forward `reason`/`trackingUrl` only when the caller actually passed one. `reject` is the
      // only transition that carries a `reason`, `ship` the only one that carries a `trackingUrl`
      // -- every other call site invokes `runAction(name)` with neither, and blindly forwarding
      // an unset value here would still pass an explicit `undefined` through to `onAction`,
      // changing its call signature from `(name)` to `(name, undefined)`.
      if (reason !== undefined) return await onAction(name, reason);
      if (trackingUrl !== undefined) return await onAction(name, undefined, trackingUrl);
      return await onAction(name);
    } finally {
      setBusy(false);
    }
  };

  const closeDialog = () => setPendingAction(null);

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-muted-foreground text-xs">{t('statusUpdate.label')}</Label>

      <Select
        value={draft}
        onValueChange={(value) => setDraft(value as CommerceOrderStatus)}
        disabled={isDisabled || isTerminal}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {/* The current status is listed so the trigger has something to show, but it is never
              a legal target -- the update button stays disabled while it is selected. */}
          <SelectItem value={order.status}>{t(`status.${order.status}`)}</SelectItem>
          {targets.map((status) => (
            <SelectItem key={status} value={status}>
              {t(`status.${status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isTerminal ? (
        <p className="text-muted-foreground text-xs">{t('statusUpdate.terminal')}</p>
      ) : (
        <p className="text-muted-foreground text-xs">{t('statusUpdate.hint')}</p>
      )}

      <Button
        type="button"
        disabled={isDisabled || pendingResolved === null}
        onClick={() => setPendingAction(pendingResolved)}
      >
        {t('statusUpdate.submit')}
      </Button>

      {canMarkPaid(order) && (
        <Button
          type="button"
          variant="outline"
          disabled={isDisabled}
          onClick={() => setMarkPaidOpen(true)}
        >
          {t('actions.markPaid')}
        </Button>
      )}

      {/*
        Every dialog below except `reject` and `ship` closes UNCONDITIONALLY once `runAction`
        settles, win or lose. None of them hold anything the seller typed -- they are pure
        confirmations -- so there is nothing a failure would destroy by closing.
        Closing is NOT what makes an already-fired failure toast visible again -- Sonner's
        `Toaster` renders above the Radix dialog overlay, so the toast was never hidden by the
        dialog being open. The real reason to close unconditionally: `OrderDetailPage` revalidates
        on `COMMERCE_ORDER_STATUS_CHANGED` (the order can move under this component -- the
        buyer's DM can promote it, another seat can approve it), and when it does, the set of
        legal transitions changes underneath a still-open, `aria-hidden` select. Closing puts the
        corrected select back in front of the seller instead of behind a manual dismiss; the
        `draft` status stays exactly what the seller chose either way (the `useEffect` above only
        resets it when `order.status` itself changes), so the select and the «بروزرسانی» button
        are right there for another attempt. `RejectPaymentDialog` and `ShipOrderDialog` are the
        two exceptions -- they hold buyer-facing text/a url the seller typed, so they alone stay
        open on failure (see their own docstrings).
      */}
      <ConfirmActionDialog
        open={pendingAction === 'approve'}
        onOpenChange={(open) => setPendingAction(open ? 'approve' : null)}
        onConfirm={async () => {
          await runAction('approve');
          closeDialog();
        }}
        title={t('dialogs.approve.title')}
        description={t('dialogs.approve.description')}
        confirmLabel={t('dialogs.approve.confirm')}
      />
      {/*
        Unlike the `ConfirmActionDialog`s around it, `ship` closes only on success -- it holds a
        typed tracking url, same reasoning as `RejectPaymentDialog` (see the big comment above):
        a failed write must not throw away up to 500 characters... here, up to one url the
        seller may not want to retype.
      */}
      <ShipOrderDialog
        open={pendingAction === 'ship'}
        onOpenChange={(open) => setPendingAction(open ? 'ship' : null)}
        shippingKind={order.shippingKind}
        onConfirm={async (trackingUrl) => {
          const ok = await runAction('ship', undefined, trackingUrl);
          if (ok) closeDialog();
          return ok;
        }}
      />
      <ConfirmActionDialog
        open={pendingAction === 'complete'}
        onOpenChange={(open) => setPendingAction(open ? 'complete' : null)}
        onConfirm={async () => {
          await runAction('complete');
          closeDialog();
        }}
        title={t('dialogs.complete.title')}
        description={t('dialogs.complete.description')}
        confirmLabel={t('dialogs.complete.confirm')}
      />
      <RejectPaymentDialog
        open={pendingAction === 'reject'}
        onOpenChange={(open) => setPendingAction(open ? 'reject' : null)}
        onConfirm={async (reason) => {
          const ok = await runAction('reject', reason);
          if (ok) closeDialog();
          return ok;
        }}
      />
      <CancelOrderDialog
        open={pendingAction === 'cancel'}
        onOpenChange={(open) => setPendingAction(open ? 'cancel' : null)}
        onConfirm={async () => {
          await runAction('cancel');
          closeDialog();
        }}
      />
      <ConfirmActionDialog
        open={markPaidOpen}
        onOpenChange={setMarkPaidOpen}
        onConfirm={async () => {
          await runAction('markPaid');
          setMarkPaidOpen(false);
        }}
        title={t('dialogs.markPaid.title')}
        description={t('dialogs.markPaid.description')}
        confirmLabel={t('dialogs.markPaid.confirm')}
      />
    </div>
  );
}
