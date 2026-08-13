'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { mutate } from 'swr';
import api from '@/hooks/swr/api-client';
import { useBusinessInfoGateStore } from '@/lib/stores/useBusinessInfoGateStore';
import { HOW_FOUND_US_ENUM, HOW_FOUND_US_VALUES } from '@/constants/howFoundUs.constant';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

/**
 * Asks «چطور با بفروش آشنا شدید؟» once, on the way into creating an automation.
 *
 * Mounted a single time in the Console layout; every create entry point opens it through
 * `useBusinessInfoGate`. Closable on purpose — unlike `WorkspaceCategoryGuard`, which
 * blocks the whole app because a workspace without a category is broken. Here the user
 * has not committed to creating anything yet, so trapping them would cost more than the
 * answer is worth. They get asked again next time.
 */
export default function BusinessInfoDialog() {
  const t = useTranslations('Automations.BusinessInfo');
  const t_ec = useTranslations('ERROR_CODES');
  const router = useRouter();
  const isOpen = useBusinessInfoGateStore((s) => s.isOpen);
  const pendingHref = useBusinessInfoGateStore((s) => s.pendingHref);
  const close = useBusinessInfoGateStore((s) => s.close);
  const [value, setValue] = useState<HOW_FOUND_US_ENUM | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const onSubmit = async () => {
    if (!value) return;
    setIsSubmitting(true);
    try {
      await api.post('/users', { howFoundUs: value });
      // `useUser` keys this request '/users/me' while ProfileForm keys it with the
      // absolute URL — two cache entries for one endpoint. Revalidate both, or the gate
      // reads a stale null and re-fires on the next create.
      await mutate('/users/me');
      await mutate(`${API_URL}/users/me`);
      const next = pendingHref;
      close();
      if (next) router.push(next);
    } catch (e: any) {
      toast.error(t_ec(e?.response?.data?.code) || t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-3">
          <label className="text-sm font-medium">{t('howFoundUs_label')}</label>
          <Select value={value} onValueChange={(v) => setValue(v as HOW_FOUND_US_ENUM)} dir="rtl">
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('howFoundUs_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {HOW_FOUND_US_VALUES.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`options.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ButtonLoading
            isLoading={isSubmitting}
            type="button"
            onClick={onSubmit}
            disabled={!value}
            className="w-full"
          >
            {t('save')}
          </ButtonLoading>
        </div>
      </DialogContent>
    </Dialog>
  );
}
