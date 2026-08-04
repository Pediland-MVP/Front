import { AutomationContentModeEnum } from '../constants/automationContent.enum';
import { useTranslations } from 'next-intl';

import { FormField, FormItem } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InputCounter } from '@/components/ui-custom/InputCounter';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';
import { AutomationButtons } from './AutomationButtons';
import { AutomationBuilderApiClient } from '../types/apiClient';

export type TextContentProps = {
  index: number;
  mode: AutomationContentModeEnum;
  control: any;
  apiClient: AutomationBuilderApiClient;
};

export const TextContent = ({ index, mode, control, apiClient }: TextContentProps) => {
  const t = useTranslations('Automations.Contents.Text');
  const t_err = useTranslations('Automations.Contents.Text.Errors');

  return (
    <FormField
      name={`${mode === AutomationContentModeEnum.AUTOMATION ? 'contents' : 'reminders'}.${index}.text`}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormItem>
          <Label>
            {t.rich('you_can_use_vars', {
              name: (chunks) => <span className="text-blue-500">{chunks}</span>,
            })}
          </Label>
          <Textarea rows={4} maxLength={1000} {...field} aria-invalid={!!error} />
          <InputCounter text={field.value} maxLength={1000} />
          <AutomationButtons
            contentIndex={index}
            mode={mode}
            contentType="text"
            apiClient={apiClient}
          />
          {error && <ErrorMessage>{t_err('required')}</ErrorMessage>}
        </FormItem>
      )}
    />
  );
};
