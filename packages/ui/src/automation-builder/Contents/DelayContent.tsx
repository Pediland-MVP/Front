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
  convertDelayMsAcrossUnit,
  delayUnitOptionsCount,
  exactMagnitudeFor,
  magnitudeOptionsFor,
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
  // Only an exact multiple of the current unit gets a displayed selection — a rounded
  // magnitude for a non-exact value (e.g. 45 seconds shown as "1" while "minutes" is
  // selected) would silently disagree with what's actually stored. Showing the placeholder
  // instead costs nothing: the real delayMs is untouched either way (see
  // convertDelayMsAcrossUnit), and picking any option from the list writes an exact value.
  const currentMagnitudeNumber = exactMagnitudeFor(delayMs, delayUnit);
  const currentMagnitude =
    currentMagnitudeNumber != null ? String(currentMagnitudeNumber) : undefined;
  const magnitudeOptions = magnitudeOptionsFor(remainingMs, delayUnit, currentMagnitudeNumber).map(
    String,
  );

  const delayMagnitudeChangeHandler = (value: string) => {
    setValue(delayMsNameKey, Number(value) * DELAY_UNIT_MS[delayUnit]);
  };

  const delayUnitChangeHandler = (value: DelayUnit) => {
    setValue(delayMsNameKey, convertDelayMsAcrossUnit(getValues(delayMsNameKey), value));
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
              {/* `aria-invalid`/`aria-disabled` are set directly on `SelectTrigger` rather
                  than relying on `FormControl`'s Slot merge: Radix's `Select` Root (the
                  direct child here) only recognizes its own known props and silently drops
                  anything else, so `FormControl` can never actually reach the trigger DOM
                  node through it. `aria-disabled` alone also carries no visual weight —
                  the shared select.tsx only styles the native `disabled:` pseudo-class —
                  so the exhausted state gets an explicit className too; a real `disabled`
                  prop can't be used here since it would also block the click this Select
                  relies on to open `DelayBudgetExhaustedDialog` instead of the dropdown. */}
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
                <SelectTrigger
                  aria-disabled={maxOptions < 1}
                  aria-invalid={invalid}
                  className={maxOptions < 1 ? 'cursor-not-allowed opacity-50' : undefined}
                >
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
