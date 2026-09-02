'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import type { OrderView } from '@/types/commerceOrders';

import { CancelOrderDialog } from './dialogs/CancelOrderDialog';
import { ConfirmActionDialog } from './dialogs/ConfirmActionDialog';
import { RejectPaymentDialog } from './dialogs/RejectPaymentDialog';
import { actionsFor, canMarkPaid, type OrderActionName } from './orderTransitions';

type ActionName = OrderActionName | 'markPaid';

interface OrderActionsProps {
  order: OrderView;
  onAction: (name: ActionName, reason?: string) => Promise<void>;
  disabled?: boolean;
}

type DialogKind = 'reject' | 'cancel' | 'ship' | 'complete';

/**
 * One button per `actionsFor(order)`, plus `markPaid` gated on `canMarkPaid` -- deliberately
 * OUTSIDE the status table (see `orderTransitions.ts`: the backend's only guard is
 * `paidAt IS NULL`, so a status-table entry would hide a legal action).
 *
 * `reject`/`cancel`/`ship`/`complete` are one-way doors, so each opens a confirmation dialog
 * first; `approve` and `markPaid` fire immediately. Every button disappears without
 * `order:manage` -- there is nothing useful to show a viewer who cannot act.
 */
export function OrderActions({ order, onAction, disabled }: OrderActionsProps) {
  const t = useTranslations('Commerce.Orders');
  const { can } = usePermissions();
  const [openDialog, setOpenDialog] = useState<DialogKind | null>(null);
  /**
   * `approve` and `markPaid` fire directly, with nothing else guarding a second click --
   * `OrderDetailPage` never actually renders this component with `disabled` set (its own
   * `isLoading` gate replaces the whole tree with a loader first, and SWR's `isLoading` stays
   * false during a revalidation), and the dialog-backed actions have their own internal
   * `isSubmitting` but that does not cover these two. Without this, a double-tap sends two
   * POSTs: the first approves, the second comes back `COMMERCE_ORDER_STATUS_CHANGED` and the
   * seller gets a conflict toast right after a successful action. `busy` closes that gap and is
   * OR'd into every button below, not just the two direct ones, so a click mid-flight cannot
   * also pop open a dialog for a different action.
   */
  const [busy, setBusy] = useState(false);

  if (!can('order:manage')) return null;

  const actions = actionsFor(order);
  const showMarkPaid = canMarkPaid(order);
  const isDisabled = disabled || busy;

  const fireDirect = (name: 'approve' | 'markPaid') => async () => {
    setBusy(true);
    try {
      await onAction(name);
    } finally {
      setBusy(false);
    }
  };

  const closeDialog = () => setOpenDialog(null);

  return (
    <div className="flex flex-wrap gap-2">
      {actions.includes('approve') && (
        <Button type="button" disabled={isDisabled} onClick={() => void fireDirect('approve')()}>
          {t('actions.approve')}
        </Button>
      )}
      {showMarkPaid && (
        <Button
          type="button"
          variant="outline"
          disabled={isDisabled}
          onClick={() => void fireDirect('markPaid')()}
        >
          {t('actions.markPaid')}
        </Button>
      )}
      {actions.includes('ship') && (
        <Button
          type="button"
          variant="outline"
          disabled={isDisabled}
          onClick={() => setOpenDialog('ship')}
        >
          {t('actions.ship')}
        </Button>
      )}
      {actions.includes('complete') && (
        <Button
          type="button"
          variant="outline"
          disabled={isDisabled}
          onClick={() => setOpenDialog('complete')}
        >
          {t('actions.complete')}
        </Button>
      )}
      {actions.includes('reject') && (
        <Button
          type="button"
          variant="destructive"
          disabled={isDisabled}
          onClick={() => setOpenDialog('reject')}
        >
          {t('actions.reject')}
        </Button>
      )}
      {actions.includes('cancel') && (
        <Button
          type="button"
          variant="destructive"
          disabled={isDisabled}
          onClick={() => setOpenDialog('cancel')}
        >
          {t('actions.cancel')}
        </Button>
      )}

      <RejectPaymentDialog
        open={openDialog === 'reject'}
        onOpenChange={(open) => setOpenDialog(open ? 'reject' : null)}
        onConfirm={async (reason) => {
          await onAction('reject', reason);
          closeDialog();
        }}
      />
      <CancelOrderDialog
        open={openDialog === 'cancel'}
        onOpenChange={(open) => setOpenDialog(open ? 'cancel' : null)}
        onConfirm={async () => {
          await onAction('cancel');
          closeDialog();
        }}
      />
      <ConfirmActionDialog
        open={openDialog === 'ship'}
        onOpenChange={(open) => setOpenDialog(open ? 'ship' : null)}
        onConfirm={async () => {
          await onAction('ship');
          closeDialog();
        }}
        title={t('dialogs.ship.title')}
        description={t('dialogs.ship.description')}
        confirmLabel={t('dialogs.ship.confirm')}
      />
      <ConfirmActionDialog
        open={openDialog === 'complete'}
        onOpenChange={(open) => setOpenDialog(open ? 'complete' : null)}
        onConfirm={async () => {
          await onAction('complete');
          closeDialog();
        }}
        title={t('dialogs.complete.title')}
        description={t('dialogs.complete.description')}
        confirmLabel={t('dialogs.complete.confirm')}
      />
    </div>
  );
}
