import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';
import { AutomationFormType } from '@/schemas/automationForm';
import p2eNumbers from '@/utils/p2eNumber';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

type DelayContentProps = {
  index: number;
};

const timeUnits = {
  sec: {
    zarib: 1000,
  },
  min: {
    zarib: 1000 * 60,
  },
  hour: {
    zarib: 1000 * 60 * 60,
  },
};

export function DelayContent({ index }: DelayContentProps) {
  const delayMsNameKey: `contents.${number}.delayMs` = `contents.${index}.delayMs`;
  const delayUnitNameKey: `contents.${number}.delayUnit` = `contents.${index}.delayUnit`;

  const { control, watch, setValue, getValues } = useFormContext<AutomationFormType>();
  const t = useTranslations('Automations.Contents.Delay');

  const delayUnit = useWatch({
    name: delayUnitNameKey,
    control,
  });

  const delayMsChangeHandler = (timeMs: number) => {
    console.log('delayMsChangeHandler', index);
    setValue(delayMsNameKey, timeMs * timeUnits[delayUnit].zarib);
  };

  useEffect(() => {
    const { delayMs, id } = watch(`contents.${index}`);
    console.log(JSON.stringify({ delayMs, index, id }, undefined, ' '));
  }, [watch(`contents.${index}`)]);

  // Preventing from words
  // Converting p2e number
  const delayMsInputHandler = (e: React.FormEvent<HTMLInputElement>) => {
    console.log('delayMsInputHandler', index);
    if (Number.isNaN(+e.currentTarget.value)) {
      const arrayOfWords = e.currentTarget.value.split('');
      arrayOfWords.pop();
      e.currentTarget.value = arrayOfWords.join();
    }
    e.currentTarget.value = p2eNumbers(e.currentTarget.value);
  };

  // Prevent from being under 1
  const delayUnitChangeHandler = (value: string) => {
    console.log('delayUnitChangeHandler', index);
    const delayMsAfterChange = getValues(delayMsNameKey) / timeUnits[value]?.zarib;
    if (delayMsAfterChange < 1) {
      setValue(delayMsNameKey, timeUnits[value].zarib);
    }
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
              {Object.keys(timeUnits).map((tKey) => (
                <SelectItem key={tKey} value={tKey}>
                  {t(`timeUnits.${tKey}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      <FormField
        name={`contents.${index}.delayMs`}
        control={control}
        render={({ field, fieldState: { invalid } }) => (
          <FormItem>
            <FormControl>
              <Input
                {...field}
                onInput={delayMsInputHandler}
                onChange={(e) => delayMsChangeHandler(+e.target.value)}
                type="text"
                value={field.value / timeUnits[delayUnit]?.zarib}
                defaultValue={field.value / timeUnits[delayUnit]?.zarib}
              />
            </FormControl>
            {invalid && <ErrorMessage>{t(`at_least_1_second`)}</ErrorMessage>}
          </FormItem>
        )}
      />
    </div>
  );
}
