"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { LayoutTable } from "@/components/layout/LayoutTable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultipleSelector, { Option } from "@/components/ui/multi-selector";
import api from "@/hooks/swr/api-client";
import { Plan } from "@/types/subscription";
import { SettingsData } from "./client-page";

interface SettingsFormProps {
  isRefetching?: boolean;
  data: SettingsData;
  plans: Plan[];
  mutate: () => void;
}

export default function SettingsForm({
  isRefetching,
  data,
  plans,
  mutate,
}: SettingsFormProps) {
  const t = useTranslations("Settings");
  const t_ec = useTranslations("ERROR_CODES");

  const [durationIds, setDurationIds] = useState<number[]>(
    data.settings.DEFAULT_FREE_PLAN_DURATION_IDS ?? [],
  );
  const [smsProvider, setSmsProvider] = useState<string>(
    data.settings.SMS_PROVIDER,
  );
  const [gateway, setGateway] = useState<string>(
    data.settings.PAYMENT_DEFAULT_GATEWAY,
  );
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch("/settings", {
        DEFAULT_FREE_PLAN_DURATION_IDS: durationIds,
        SMS_PROVIDER: smsProvider,
        PAYMENT_DEFAULT_GATEWAY: gateway,
      });
      toast.success(t("saveSuccess"));
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(t_ec(code) || t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-6 p-6" dir="rtl">
        <div>
          <h1 className="text-lg font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex max-w-xl flex-col gap-6">
          {/* Default free plan durations */}
          <div className="flex flex-col gap-2 rounded-lg border p-4">
            <Label>{t("defaultFreePlanDurations")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("defaultFreePlanDurationsHint")}
            </p>
            <MultipleSelector
              value={selectedDurationOptions}
              options={durationOptions}
              placeholder={t("selectDurations")}
              hidePlaceholderWhenSelected
              emptyIndicator={
                <span className="text-sm text-muted-foreground">
                  {t("noDurations")}
                </span>
              }
              onChange={(opts) =>
                setDurationIds(opts.map((o) => Number(o.value)))
              }
            />
          </div>

          {/* SMS provider */}
          <div className="flex flex-col gap-2 rounded-lg border p-4">
            <Label>{t("smsProvider")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("smsProviderHint")}
            </p>
            <Select value={smsProvider} onValueChange={setSmsProvider}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectProvider")} />
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
            <Label>{t("paymentGateway")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("paymentGatewayHint")}
            </p>
            <Select value={gateway} onValueChange={setGateway}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectGateway")} />
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

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </div>
    </LayoutTable>
  );
}
