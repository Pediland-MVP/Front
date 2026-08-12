'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import api from '@/hooks/swr/api-client';
import { useIncomingTransfers } from '@/hooks/useIncomingTransfers';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function IncomingTransferBanner() {
  const t = useTranslations('Settings.OwnershipTransfer');
  const t_ec = useTranslations('ERROR_CODES');
  const { transfers, mutate } = useIncomingTransfers();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!transfers.length) return null;

  const act = async (transfer: (typeof transfers)[number], action: 'accept' | 'reject') => {
    setBusyId(transfer.id);
    try {
      await api.post(
        `/workspaces/${transfer.workspace.id}/ownership-transfer/${transfer.id}/${action}`,
      );
      if (action === 'accept') {
        toast.success(t('accept_success'));
        window.location.reload();
        return;
      }
      toast.success(t('reject_success'));
      await mutate();
    } catch (e: any) {
      toast.error(t_ec(e?.response?.data?.code) || t('action_error'));
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="space-y-3">
      {transfers.map((transfer) => (
        <div
          key={transfer.id}
          className="border-primary/30 bg-primary/5 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm">
            {t('incoming_text', {
              name: `${transfer.fromUser.firstname} ${transfer.fromUser.lastname}`.trim(),
              workspace: transfer.workspace.name,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={busyId === transfer.id}
              onClick={() => setConfirmId(transfer.id)}
            >
              {t('accept')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busyId === transfer.id}
              onClick={() => act(transfer, 'reject')}
            >
              {t('reject')}
            </Button>
          </div>

          <AlertDialog
            open={confirmId === transfer.id}
            onOpenChange={(open) => !open && setConfirmId(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('accept_confirm_title')}</AlertDialogTitle>
                <AlertDialogDescription>{t('accept_confirm_description')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction
                  disabled={busyId === transfer.id}
                  onClick={() => act(transfer, 'accept')}
                >
                  {t('accept')}
                </AlertDialogAction>
                <AlertDialogCancel
                  disabled={busyId === transfer.id}
                  onClick={() => setConfirmId(null)}
                >
                  {t('cancel')}
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );
}
