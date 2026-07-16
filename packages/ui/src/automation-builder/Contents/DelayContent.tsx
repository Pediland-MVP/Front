import {
  FormControl,
  FormField,
  FormItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';
import { AutomationFormType, ContentItemType } from '../schemas/automationForm';
import {
  DELAY_UNIT_MS,
  DelayUnit,
  delayUnitOptionsCount,
  remainingDelayBudgetMs,
} from '../utils/delayBudget';
import { DelayBudgetExhaustedDialog } from './DelayBudgetExhaustedDialog';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

type DelayContentProps = {
  index: number;
};

export function DelayContent({ index }: DelayContentProps) {
  const delayMsNameKey: `contents.${number}.delayMs` = `contents.${index}.delayMs`;
  const delayUnitNameKey: `contents.${number}.delayUnit` = `contents.${index}.delayUnit`;

  const { control, setValue, getValues } = useFormContext<AutomationFormType>();
  const t = useTranslations('Automations.Contents.Delay');

  const [isMagnitudeOpen, setIsMagnitudeOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);

  const delayUnit = (useWatch({ name: delayUnitNameKey, control }) as DelayUnit) || 'hour';
  const delayMs = useWatch({ name: delayMsNameKey, control });
  const contents = (useWatch({ name: 'contents', control }) ?? []) as ContentItemType[];

  const remainingMs = remainingDelayBudgetMs(contents, index);
  const maxOptions = delayUnitOptionsCount(remainingMs, delayUnit);
  const magnitudeOptions = Array.from({ length: maxOptions }, (_, i) => String(i + 1));
  const currentMagnitude =
    delayMs != null ? String(Math.round(delayMs / DELAY_UNIT_MS[delayUnit])) : undefined;

  const delayMagnitudeChangeHandler = (value: string) => {
    setValue(delayMsNameKey, Number(value) * DELAY_UNIT_MS[delayUnit]);
  };

  // Prevent from being under 1 (existing rule) and clamp to the remaining budget for the
  // newly selected unit (new rule) when converting the stored value across units. If the
  // new unit has no room at all (newMax === 0), the value is left at its 1-unit floor —
  // this rare over-budget edge case is caught by the submit-time total-delay check
  // (dashboard's `AutomationForm.tsx` / admin's `TemplateForm.tsx`), not silently hidden.
  const delayUnitChangeHandler = (value: DelayUnit) => {
    const newMax = delayUnitOptionsCount(remainingDelayBudgetMs(contents, index), value);
    const rawMagnitude = getValues(delayMsNameKey) / DELAY_UNIT_MS[value];
    const clampedMagnitude = Math.min(Math.max(1, Math.round(rawMagnitude)), Math.max(newMax, 1));
    setValue(delayMsNameKey, clampedMagnitude * DELAY_UNIT_MS[value]);
    setValue(delayUnitNameKey, value);
  };

  return (
    <div className="flex items-center justify-center gap-x-2">
      <FormField
        name={delayUnitNameKey}
        control={control}
        render={({ field }) => (
          <Select onValueChange={delayUnitChangeHandler} defaultValue={field.value}>
            <SelectTrigger>
              <SelectValue placeholder={t('selectTimeUnit')} />
            </SelectTrigger>
            <SelectContent>
              {(['sec', 'min', 'hour'] as DelayUnit[]).map((tKey) => (
                <SelectItem key={tKey} value={tKey}>
                  {t(`timeUnits.${tKey}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      <FormField
        name={delayMsNameKey}
        control={control}
        render={({ fieldState: { invalid } }) => (
          <FormItem>
            <FormControl>
              <Select
                value={currentMagnitude}
                onValueChange={delayMagnitudeChangeHandler}
                open={isMagnitudeOpen}
                onOpenChange={(nextOpen) => {
                  if (nextOpen && maxOptions < 1) {
                    setIsBudgetDialogOpen(true);
                    return;
                  }
                  setIsMagnitudeOpen(nextOpen);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectValue')} />
                </SelectTrigger>
                <SelectContent>
                  {magnitudeOptions.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            {invalid && <ErrorMessage>{t('at_least_1_second')}</ErrorMessage>}
          </FormItem>
        )}
      />

      <DelayBudgetExhaustedDialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen} />
    </div>
  );
}
