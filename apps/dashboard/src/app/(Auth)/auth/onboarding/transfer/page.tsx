'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/hooks/swr/api-client';
import { useIncomingTransfers } from '@/hooks/useIncomingTransfers';
import { isSafeInternalPath } from '@/utils/safeInternalPath';
import { IncomingTransfer } from '@/types/ownershipTransfer';
import { Button } from '@/components/ui/button';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
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

export default function OnboardingTransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Auth.OwnershipTransfer');
  const t_ot = useTranslations('Settings.OwnershipTransfer');
  const t_ec = useTranslations('ERROR_CODES');
  const { transfers, isLoading, mutate } = useIncomingTransfers();

  // returnTo is set by AuthProvider so Skip/accept sends the user back to
  // /connect rather than some other page they weren't actually on. It comes
  // from the URL query string, so only accept a same-origin relative path
  // (see isSafeInternalPath) — otherwise a crafted link could redirect the
  // user off-site.
  const rawReturnTo = searchParams.get('returnTo');
  const returnTo = isSafeInternalPath(rawReturnTo) ? rawReturnTo : '/connect';

  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);

  const act = async (transfer: IncomingTransfer, action: 'accept' | 'reject') => {
    setBusyId(transfer.id);
    try {
      await api.post(
        `/workspaces/${transfer.workspace.id}/ownership-transfer/${transfer.id}/${action}`,
      );
      if (action === 'accept') {
        toast.success(t_ot('accept_success'));
        // Full reload so AuthProvider re-evaluates routing from scratch with the
        // transfer no longer pending (same pattern as the console-side banner).
        window.location.href = '/';
        return;
      }
      toast.success(t_ot('reject_success'));
      await mutate();
    } catch (e: any) {
      toast.error(t_ec(e?.response?.data?.code) || t_ot('action_error'));
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  // Mirrors the invitations picker's Skip: dismiss for this session so
  // AuthProvider doesn't bounce the user straight back here.
  const handleSkip = () => {
    setIsSkipping(true);
    sessionStorage.setItem('ownershipTransferDismissed', '1');
    router.push(returnTo);
  };

  if (isLoading) {
    return (
      <div className="flex h-lvh w-full items-center justify-center">
        <LoaderSpin />
      </div>
    );
  }

  if (transfers.length === 0) {
    // Defensive — AuthProvider normally prevents landing here with no transfers.
    return (
      <div className="flex h-lvh w-full flex-col items-center justify-center px-10">
        <p className="text-muted-foreground mb-4 text-sm">{t('no_transfers')}</p>
        <ButtonLoading onClick={handleSkip} isLoading={isSkipping}>
          {t('continue')}
        </ButtonLoading>
      </div>
    );
  }

  return (
    <div className="flex h-lvh w-full flex-col items-center justify-start overflow-x-hidden px-6 pt-12">
      <div className="flex w-full max-w-md flex-1 flex-col items-center justify-start">
        <h1 className="text-primary mb-1 text-lg font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground mb-5 text-center text-sm">{t('description')}</p>

        <div className="w-full space-y-3">
          {transfers.map((transfer) => (
            <div key={transfer.id} className="border-primary/30 bg-primary/5 rounded-lg border p-4">
              <p className="mb-3 text-sm">
                {t_ot('incoming_text', {
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
                  {t_ot('accept')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === transfer.id}
                  onClick={() => act(transfer, 'reject')}
                >
                  {t_ot('reject')}
                </Button>
              </div>

              <AlertDialog
                open={confirmId === transfer.id}
                onOpenChange={(open) => !open && setConfirmId(null)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t_ot('accept_confirm_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t_ot('accept_confirm_description')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction
                      disabled={busyId === transfer.id}
                      onClick={() => act(transfer, 'accept')}
                    >
                      {t_ot('accept')}
                    </AlertDialogAction>
                    <AlertDialogCancel
                      disabled={busyId === transfer.id}
                      onClick={() => setConfirmId(null)}
                    >
                      {t_ot('cancel')}
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>

        <ButtonLoading
          type="button"
          variant="link"
          onClick={handleSkip}
          isLoading={isSkipping}
          className="text-muted-foreground mt-4 w-full"
        >
          {t('continue')}
        </ButtonLoading>
      </div>
    </div>
  );
}
