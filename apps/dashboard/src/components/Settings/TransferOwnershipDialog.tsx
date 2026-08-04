'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import api from '@/hooks/swr/api-client';
import { useActiveTransfer } from '@/hooks/useActiveTransfer';
import useUser from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
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

type Step = 'form' | 'otp' | 'sent';
type Mode = 'leave' | 'stay';

interface Recipient {
  name?: string;
  mobile?: string;
  email?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onCompleted: () => void;
}

// A recipient can be reached by mobile OR email — the field is text, so we map
// Persian/Arabic digits to latin WITHOUT stripping letters (the shared p2e
// handler strips every non-digit and would destroy an email).
const p2eKeepText = (v: string) =>
  v
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

const isMobile = (v: string) => /^09\d{9}$/.test(v);
const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
const isValidIdentifier = (v: string) => isMobile(v) || isEmail(v);

// The OTP always goes to the OWNER (the person driving this dialog), never the
// recipient — mask it before display so the dialog doesn't print a full
// mobile/email on screen.
const maskMobile = (v: string) => (v.length <= 8 ? v : `${v.slice(0, 4)}***${v.slice(-4)}`);
const maskEmail = (v: string) => {
  const [local, domain] = v.split('@');
  if (!domain) return v;
  const visible =
    local.length <= 2 ? local[0] : `${local[0]}${'*'.repeat(local.length - 2)}${local.slice(-1)}`;
  return `${visible}@${domain}`;
};

export function TransferOwnershipDialog({ isOpen, onClose, workspaceId, onCompleted }: Props) {
  const t = useTranslations('Settings.OwnershipTransfer');
  const t_ec = useTranslations('ERROR_CODES');
  const locale = useLocale();

  // Only fetch while the dialog is open; the PendingTransferNotice keeps the same
  // SWR key warm, so this usually resolves from cache immediately on open.
  const { activeTransfer } = useActiveTransfer(isOpen ? workspaceId : null);
  // The OTP channel follows the backend rule exactly (SMS if the owner has a
  // mobile, else email) — deriving it from the current user avoids needing the
  // backend to echo the address back, and stays correct across resend/resume too.
  const { user } = useUser();
  const otpDestination = user?.mobile
    ? maskMobile(user.mobile)
    : user?.email
      ? maskEmail(user.email)
      : null;

  const [step, setStep] = useState<Step>('form');
  const [identifier, setIdentifier] = useState('');
  const [identifierConfirm, setIdentifierConfirm] = useState('');
  const [mode, setMode] = useState<Mode>('leave');
  const [otp, setOtp] = useState('');
  const [transferId, setTransferId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [showStayWarning, setShowStayWarning] = useState(false);
  // Seconds until a resend is allowed again (mirrors the backend 60s cooldown).
  const [cooldown, setCooldown] = useState(0);

  const reset = () => {
    setStep('form');
    setIdentifier('');
    setIdentifierConfirm('');
    setMode('leave');
    setOtp('');
    setTransferId(null);
    setRecipient(null);
    setShowStayWarning(false);
    setCooldown(0);
  };

  // Tick the resend cooldown down to zero.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Resume an in-flight transfer when the dialog opens. If the owner already
  // started one (e.g. left during the OTP step), jump straight to that step with
  // the transfer preset instead of showing a fresh form that would only fail with
  // TRANSFER_ALREADY_ACTIVE.
  useEffect(() => {
    if (!isOpen || !activeTransfer) return;
    if (activeTransfer.toUser) {
      // Only the recipient's NAME is shown on resume. activeTransfer.toUser
      // carries their full profile (both contact channels), but the owner
      // only ever supplied one identifier to initiate — echoing a channel
      // here would disclose contact info they never entered (and may not
      // otherwise know). The name is enough to confirm who the in-flight
      // transfer is going to.
      setRecipient({
        name: `${activeTransfer.toUser.firstname} ${activeTransfer.toUser.lastname}`.trim(),
      });
    }
    if (activeTransfer.status === 'pending_otp') {
      setTransferId(activeTransfer.id);
      setMode(activeTransfer.mode);
      setStep('otp');
      setCooldown(activeTransfer.resendCooldownSeconds ?? 0);
    } else if (activeTransfer.status === 'pending_acceptance') {
      setStep('sent');
    }
  }, [isOpen, activeTransfer]);

  const close = () => {
    if (isBusy) return;
    reset();
    onClose();
  };

  const initiate = async (chosenMode: Mode) => {
    if (!isValidIdentifier(identifier)) {
      toast.error(t('invalid_identifier'));
      return;
    }
    if (identifier.trim().toLowerCase() !== identifierConfirm.trim().toLowerCase()) {
      toast.error(t('identifier_mismatch'));
      return;
    }
    setIsBusy(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/ownership-transfer/initiate`, {
        targetIdentifier: identifier.trim(),
        targetIdentifierConfirm: identifierConfirm.trim(),
        mode: chosenMode,
      });
      const data = res?.data?.data || res?.data;
      setTransferId(data.transferId);
      setMode(chosenMode);
      // We only know what the owner typed here (initiate returns no profile); the
      // resume path fills in the recipient's name from getActive.
      setRecipient({
        mobile: isMobile(identifier) ? identifier.trim() : undefined,
        email: isEmail(identifier) ? identifier.trim() : undefined,
      });
      setStep('otp');
      setCooldown(60);
      toast.success(t(data.channel === 'email' ? 'otp_sent_email' : 'otp_sent_sms'));
    } catch (e: any) {
      toast.error(t_ec(e?.response?.data?.code) || t('initiate_error'));
    } finally {
      setIsBusy(false);
      setShowStayWarning(false);
    }
  };

  // Ask the backend to send a fresh code (resets the 10-min OTP window). The 60s
  // cooldown is enforced server-side too; the client countdown just hides the button.
  const resend = async () => {
    if (!transferId || cooldown > 0 || isBusy) return;
    setIsBusy(true);
    try {
      const res = await api.post(
        `/workspaces/${workspaceId}/ownership-transfer/${transferId}/resend-otp`,
      );
      const data = res?.data?.data || res?.data;
      setOtp('');
      setCooldown(60);
      toast.success(t(data.channel === 'email' ? 'otp_sent_email' : 'otp_sent_sms'));
    } catch (e: any) {
      toast.error(t_ec(e?.response?.data?.code) || t('confirm_error'));
    } finally {
      setIsBusy(false);
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

  const recipientBlock = recipient && (
    <div className="bg-muted/40 mt-1 rounded-md px-3 py-2 text-sm">
      <span className="text-muted-foreground">{t('recipient_label')}: </span>
      {recipient.name ? <span className="font-medium">{recipient.name} </span> : null}
      {recipient.mobile ? (
        <span dir="ltr" className="font-medium">
          {recipient.mobile}
        </span>
      ) : null}
      {recipient.email ? (
        <span dir="ltr" className="font-medium">
          {recipient.mobile ? ' — ' : ''}
          {recipient.email}
        </span>
      ) : null}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">
          {step === 'form' && (
            <>
              <DialogHeader>
                <DialogTitle>{t('title')}</DialogTitle>
                <DialogDescription>{t('warning_description')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <label className="text-sm font-medium">{t('target_identifier')}</label>
                <Input
                  dir="ltr"
                  placeholder="09123456789 / name@mail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(p2eKeepText(e.target.value))}
                />
                <label className="text-sm font-medium">{t('target_identifier_confirm')}</label>
                <Input
                  dir="ltr"
                  placeholder="09123456789 / name@mail.com"
                  value={identifierConfirm}
                  onChange={(e) => setIdentifierConfirm(p2eKeepText(e.target.value))}
                />
              </div>
              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
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
              {otpDestination && (
                <p className="text-muted-foreground -mt-1 text-center text-sm">
                  {t('otp_sent_to')}{' '}
                  <span dir="ltr" className="font-medium">
                    {otpDestination}
                  </span>
                </p>
              )}
              {recipientBlock}
              <div className="flex justify-center py-4">
                <InputOTP
                  maxLength={5}
                  value={otp}
                  onChange={setOtp}
                  pattern={REGEXP_ONLY_DIGITS}
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
              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <Button
                  variant="link"
                  disabled={isBusy || cooldown > 0}
                  onClick={resend}
                  className="sm:me-auto"
                >
                  {cooldown > 0 ? t('resend_in', { seconds: cooldown }) : t('resend_otp')}
                </Button>
                <Button variant="ghost" disabled={isBusy} onClick={close}>
                  {t('cancel')}
                </Button>
                <Button disabled={isBusy || otp.length !== 5} onClick={confirm}>
                  {t('confirm')}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'sent' && (
            <>
              <DialogHeader>
                <DialogTitle>{t('title')}</DialogTitle>
                <DialogDescription>
                  {t('awaiting_acceptance_notice', { name: recipient?.name ?? '' })}
                </DialogDescription>
              </DialogHeader>
              {recipientBlock}
              <DialogFooter>
                <Button variant="ghost" disabled={isBusy} onClick={close}>
                  {t('close')}
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
