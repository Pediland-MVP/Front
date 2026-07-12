'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import api from '@/hooks/swr/api-client';
import { useActiveTransfer } from '@/hooks/useActiveTransfer';
import { Button } from '@/components/ui';
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

interface Props {
  workspaceId: string;
  onChange?: () => void;
}

export function PendingTransferNotice({ workspaceId, onChange }: Props) {
  const t = useTranslations('Settings.OwnershipTransfer');
  const t_ec = useTranslations('ERROR_CODES');
  const { activeTransfer, mutate } = useActiveTransfer(workspaceId);
  const [isBusy, setIsBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!activeTransfer) return null;

  const targetName = activeTransfer.toUser
    ? `${activeTransfer.toUser.firstname} ${activeTransfer.toUser.lastname}`.trim()
    : '';

  const message =
    activeTransfer.status === 'pending_otp'
      ? t('pending_notice_otp')
      : t('pending_notice_acceptance', { name: targetName });

  const cancel = async () => {
    setIsBusy(true);
    try {
      await api.post(`/workspaces/${workspaceId}/ownership-transfer/${activeTransfer.id}/cancel`);
      toast.success(t('cancel_success'));
      await mutate();
      onChange?.();
    } catch (e: any) {
      toast.error(t_ec(e?.response?.data?.code) || t('cancel_error'));
    } finally {
      setIsBusy(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="border-primary/30 bg-primary/5 mt-2 flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p>{message}</p>
      <Button variant="outline" size="sm" disabled={isBusy} onClick={() => setConfirmOpen(true)}>
        {t('cancel_pending')}
      </Button>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => !open && !isBusy && setConfirmOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cancel_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('cancel_confirm_description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction disabled={isBusy} onClick={cancel}>
              {t('cancel_pending')}
            </AlertDialogAction>
            <AlertDialogCancel disabled={isBusy} onClick={() => setConfirmOpen(false)}>
              {t('cancel')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
