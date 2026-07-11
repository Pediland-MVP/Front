'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import api from '@/hooks/swr/api-client';
import { onInputP2EHandler } from '@/utils/p2eNumber';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui';
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

type Step = 'form' | 'otp';
type Mode = 'leave' | 'stay';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onCompleted: () => void;
}

export function TransferOwnershipDialog({ isOpen, onClose, workspaceId, onCompleted }: Props) {
  const t = useTranslations('Settings.OwnershipTransfer');
  const t_ec = useTranslations('ERROR_CODES');
  const locale = useLocale();

  const [step, setStep] = useState<Step>('form');
  const [mobile, setMobile] = useState('');
  const [mobileConfirm, setMobileConfirm] = useState('');
  const [mode, setMode] = useState<Mode>('leave');
  const [otp, setOtp] = useState('');
  const [transferId, setTransferId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [showStayWarning, setShowStayWarning] = useState(false);

  const reset = () => {
    setStep('form');
    setMobile('');
    setMobileConfirm('');
    setMode('leave');
    setOtp('');
    setTransferId(null);
    setShowStayWarning(false);
  };

  const close = () => {
    if (isBusy) return;
    reset();
    onClose();
  };

  const initiate = async (chosenMode: Mode) => {
    if (!/^09\d{9}$/.test(mobile)) {
      toast.error(t('invalid_mobile'));
      return;
    }
    if (mobile !== mobileConfirm) {
      toast.error(t('mobile_mismatch'));
      return;
    }
    setIsBusy(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/ownership-transfer/initiate`, {
        targetMobile: mobile,
        targetMobileConfirm: mobileConfirm,
        mode: chosenMode,
      });
      const data = res?.data?.data || res?.data;
      setTransferId(data.transferId);
      setMode(chosenMode);
      setStep('otp');
      toast.success(t(data.channel === 'email' ? 'otp_sent_email' : 'otp_sent_sms'));
    } catch (e: any) {
      toast.error(t_ec(e?.response?.data?.code) || t('initiate_error'));
    } finally {
      setIsBusy(false);
      setShowStayWarning(false);
    }
  };

  const confirm = async () => {
    if (otp.length !== 5 || !transferId) return;
    setIsBusy(true);
    try {
      await api.post(`/workspaces/${workspaceId}/ownership-transfer/${transferId}/confirm`, {
        otp,
      });
      toast.success(t('request_sent'));
      reset();
      onClose();
      onCompleted();
    } catch (e: any) {
      toast.error(t_ec(e?.response?.data?.code) || t('confirm_error'));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          {step === 'form' && (
            <>
              <DialogHeader>
                <DialogTitle>{t('title')}</DialogTitle>
                <DialogDescription>{t('warning_description')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <label className="text-sm font-medium">{t('target_mobile')}</label>
                <Input
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="09123456789"
                  value={mobile}
                  onInput={onInputP2EHandler}
                  onChange={(e) => setMobile(e.target.value)}
                />
                <label className="text-sm font-medium">{t('target_mobile_confirm')}</label>
                <Input
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="09123456789"
                  value={mobileConfirm}
                  onInput={onInputP2EHandler}
                  onChange={(e) => setMobileConfirm(e.target.value)}
                />
              </div>
              <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                <Button variant="destructive" disabled={isBusy} onClick={() => initiate('leave')}>
                  {t('transfer_and_leave')}
                </Button>
                <Button
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => setShowStayWarning(true)}
                >
                  {t('transfer_only')}
                </Button>
                <Button variant="ghost" disabled={isBusy} onClick={close}>
                  {t('cancel')}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'otp' && (
            <>
              <DialogHeader>
                <DialogTitle>{t('otp_title')}</DialogTitle>
                <DialogDescription>{t('otp_description')}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-4">
                <InputOTP
                  maxLength={5}
                  value={otp}
                  onChange={setOtp}
                  pattern={REGEXP_ONLY_DIGITS}
                  onInput={onInputP2EHandler}
                  onComplete={confirm}
                  autoFocus
                >
                  <InputOTPGroup className={locale === 'fa' ? 'flex-row-reverse' : ''}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <DialogFooter>
                <Button disabled={isBusy || otp.length !== 5} onClick={confirm}>
                  {t('confirm')}
                </Button>
                <Button variant="ghost" disabled={isBusy} onClick={close}>
                  {t('cancel')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showStayWarning}
        onOpenChange={(open) => !open && setShowStayWarning(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('stay_warning_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('stay_warning_description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => initiate('stay')}>
              {t('stay_confirm')}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setShowStayWarning(false)}>
              {t('cancel')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
