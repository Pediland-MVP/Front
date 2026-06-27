'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { LayoutTable } from '@/components/layout/LayoutTable';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MultipleSelector, { Option } from '@/components/ui/multi-selector';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import api from '@/hooks/swr/api-client';
import { Plan } from '@/types/subscription';
import { ApifyToken, SettingsData } from './client-page';
import ReconcileMetricsCard from './reconcile-metrics-card';

interface SettingsFormProps {
  isRefetching?: boolean;
  data: SettingsData;
  plans: Plan[];
  mutate: () => void;
  showReconcile?: boolean;
}

export default function SettingsForm({
  isRefetching,
  data,
  plans,
  mutate,
  showReconcile,
}: SettingsFormProps) {
  const t = useTranslations('Settings');
  const t_ec = useTranslations('ERROR_CODES');

  const [durationIds, setDurationIds] = useState<number[]>(
    data.settings.DEFAULT_FREE_PLAN_DURATION_IDS ?? [],
  );
  const [smsProvider, setSmsProvider] = useState<string>(data.settings.SMS_PROVIDER);
  const [gateway, setGateway] = useState<string>(data.settings.PAYMENT_DEFAULT_GATEWAY);
  const [apifyTokens, setApifyTokens] = useState<ApifyToken[]>(data.settings.APIFY_TOKENS ?? []);
  const [isSaving, setIsSaving] = useState(false);

  // Flatten every plan's durations into selectable options.
  const durationOptions = useMemo<Option[]>(
    () =>
      plans.flatMap((plan) =>
        (plan.durations ?? []).map((d) => ({
          value: String(d.id),
          label: `${plan.name} - ${d.name}`,
        })),
      ),
    [plans],
  );

  const selectedDurationOptions = useMemo<Option[]>(
    () =>
      durationIds.map((id) => {
        const match = durationOptions.find((o) => o.value === String(id));
        return match ?? { value: String(id), label: String(id) };
      }),
    [durationIds, durationOptions],
  );

  const smsOptions = data.options.SMS_PROVIDER ?? [];
  const gatewayOptions = data.options.PAYMENT_DEFAULT_GATEWAY ?? [];

  const updateToken = (index: number, patch: Partial<ApifyToken>) =>
    setApifyTokens((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const addToken = () => setApifyTokens((rows) => [...rows, { name: '', token: '' }]);
  const removeToken = (index: number) =>
    setApifyTokens((rows) => rows.filter((_, i) => i !== index));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/settings', {
        DEFAULT_FREE_PLAN_DURATION_IDS: durationIds,
        SMS_PROVIDER: smsProvider,
        PAYMENT_DEFAULT_GATEWAY: gateway,
        APIFY_TOKENS: apifyTokens
          .map((t) => ({ name: t.name.trim(), token: t.token.trim() }))
          .filter((t) => t.token.length > 0),
      });
      toast.success(t('saveSuccess'));
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(t_ec(code) || t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-6 p-6" dir="rtl">
        <div>
          <h1 className="text-lg font-bold">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>

        <div className="flex max-w-xl flex-col gap-6">
          {/* Default free plan durations */}
          <div className="flex flex-col gap-2 rounded-lg border p-4">
            <Label>{t('defaultFreePlanDurations')}</Label>
            <p className="text-muted-foreground text-xs">{t('defaultFreePlanDurationsHint')}</p>
            <MultipleSelector
              value={selectedDurationOptions}
              options={durationOptions}
              placeholder={t('selectDurations')}
              hidePlaceholderWhenSelected
              emptyIndicator={
                <span className="text-muted-foreground text-sm">{t('noDurations')}</span>
              }
              onChange={(opts) => setDurationIds(opts.map((o) => Number(o.value)))}
            />
          </div>

          {/* SMS provider */}
          <div className="flex flex-col gap-2 rounded-lg border p-4">
            <Label>{t('smsProvider')}</Label>
            <p className="text-muted-foreground text-xs">{t('smsProviderHint')}</p>
            <Select value={smsProvider} onValueChange={setSmsProvider}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectProvider')} />
              </SelectTrigger>
              <SelectContent>
                {smsOptions.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {t(`smsProviderOptions.${provider}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment default gateway */}
          <div className="flex flex-col gap-2 rounded-lg border p-4">
            <Label>{t('paymentGateway')}</Label>
            <p className="text-muted-foreground text-xs">{t('paymentGatewayHint')}</p>
            <Select value={gateway} onValueChange={setGateway}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectGateway')} />
              </SelectTrigger>
              <SelectContent>
                {gatewayOptions.map((g) => (
                  <SelectItem key={g} value={g}>
                    {t(`paymentGatewayOptions.${g}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Apify API tokens (super-admin managed) */}
          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <Label>{t('apifyTokens')}</Label>
            <p className="text-muted-foreground text-xs">{t('apifyTokensHint')}</p>

            <div className="flex flex-col gap-2">
              {apifyTokens.length === 0 && (
                <span className="text-muted-foreground text-sm">{t('apifyTokensEmpty')}</span>
              )}
              {apifyTokens.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    className="w-1/3"
                    value={row.name}
                    placeholder={t('apifyTokenNamePlaceholder')}
                    onChange={(e) => updateToken(index, { name: e.target.value })}
                  />
                  <Input
                    className="flex-1"
                    value={row.token}
                    placeholder={t('apifyTokenValuePlaceholder')}
                    onChange={(e) => updateToken(index, { token: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeToken(index)}
                    aria-label={t('apifyTokenRemove')}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={addToken}
            >
              <Plus className="size-4" />
              {t('apifyTokenAdd')}
            </Button>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('saving') : t('save')}
            </Button>
          </div>
        </div>
      </div>

      {showReconcile && (
        <div className="px-6 pb-6">
          <ReconcileMetricsCard />
        </div>
      )}
    </LayoutTable>
  );
}
