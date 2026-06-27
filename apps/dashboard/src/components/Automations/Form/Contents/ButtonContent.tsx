// src/components/Automations/Form/Contents/ButtonContent.tsx
'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { AutomationContentModeEnum } from '@/constants/automationContent.enum';
import { AutomationFormType } from '@/schemas/automationForm';
import { useTranslations } from 'next-intl';

import { FormField, FormItem, FormLabel, Textarea } from '@/components/ui';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';
import { InputCounter } from '@/components/ui-custom/InputCounter';
import { AutomationButtons } from './AutomationButtons';

type ButtonContentProps = {
  mode: AutomationContentModeEnum;
  contentIndex: number;
};

export const ButtonContent = ({ contentIndex, mode }: ButtonContentProps) => {
  const t = useTranslations('Automations.Contents.Button');
  const t_err = useTranslations('Automations.Contents.Button.Errors');

  const { control } = useFormContext<AutomationFormType>();

  // NOTE: I dindt changed default name of fields becuase it was not working :)
  const { fields, move, remove, append } = useFieldArray({
    control: control,
    name: `${mode === AutomationContentModeEnum.AUTOMATION ? 'contents' : 'reminders'}.${contentIndex}.buttonTemplate.buttons`,
  });

  return (
    <div className="flex flex-col gap-y-3">
      <FormField
        control={control}
        name={`${mode === AutomationContentModeEnum.AUTOMATION ? 'contents' : 'reminders'}.${contentIndex}.buttonTemplate.text`}
        render={({ field, fieldState: { error } }) => (
          <FormItem>
            <FormLabel>{t('text.label')}</FormLabel>
            <Textarea
              {...field}
              maxLength={640}
              aria-invalid={!!error}
              placeholder={t('text.placeholder')}
            />
            <InputCounter text={field.value} maxLength={640} />
            {error && <ErrorMessage>{t_err('required')}</ErrorMessage>}
          </FormItem>
        )}
      />

      <AutomationButtons contentIndex={contentIndex} mode={mode} contentType="buttonTemplate" />
    </div>
  );
};
