'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/hooks/swr/api-client';

// Manual trigger for the metrics reconcile (POST /metrics/reconcile). Recomputes
// every workspace's metric counters (sessions, leads, …) from live data so the
// label engine and dashboards reflect reality without waiting for the weekly
// cron. Backend route is super-admin only; this card is also gated to ADMIN in
// the settings page.
export default function ReconcileMetricsCard() {
  const t = useTranslations('Settings');
  const t_ec = useTranslations('ERROR_CODES');
  const [isRunning, setIsRunning] = useState(false);

  const handleReconcile = async () => {
    setIsRunning(true);
    try {
      await api.post('/metrics/reconcile');
      toast.success(t('reconcileStarted'));
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(t_ec(code) || t('reconcileError'));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card dir="rtl" className="max-w-xl">
      <CardHeader>
        <CardTitle>{t('reconcileTitle')}</CardTitle>
        <CardDescription>{t('reconcileDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleReconcile} disabled={isRunning}>
          {isRunning ? t('reconcileRunning') : t('reconcileButton')}
        </Button>
      </CardContent>
    </Card>
  );
}
