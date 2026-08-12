'use client';

import { useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import api from '@/hooks/swr/api-client';
import { ExceptionMessage } from '@/types/exceptionMessage';

/**
 * Terminate a session by id. The backend enforces the real rules (age > 5 days,
 * not the current session, ownership); this hook just calls it and surfaces the
 * translated error code on failure.
 */
export function useTerminateSession(onSuccess?: () => void) {
  const t = useTranslations('Settings.AccountSessions');
  const t_ec = useTranslations('ERROR_CODES');
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  const terminate = async (sessionId: string) => {
    setTerminatingId(sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      toast.success(t('terminate_success'));
      onSuccess?.();
    } catch (e) {
      const error = e as AxiosError<ExceptionMessage>;
      toast.error(t_ec(error.response?.data?.code) || error.response?.data?.message);
    } finally {
      setTerminatingId(null);
    }
  };

  return { terminate, terminatingId };
}
