import { Alert, AlertTitle, Button } from '@/components/ui';
import { ContentTypeOption, contentTypeOptions } from './ContentTypeOptions';
import { useTranslations } from 'next-intl';

type ChooseAutomationTypeProps = {
  onSelect: (option: ContentTypeOption) => any;
};

export function ChooseAutomationType({ onSelect }: ChooseAutomationTypeProps) {
  const t_contentTypes = useTranslations('Automations.Contents.Types');
  return (
    <>
      <Alert variant="note" className="col-span-5">
        <AlertTitle>{t_contentTypes('select_your_type')}</AlertTitle>
      </Alert>
      <div className="grid w-full grid-cols-5 justify-start gap-x-1.5 gap-y-2.5">
        {contentTypeOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            onClick={() => onSelect(option)}
            className="flex flex-col items-center justify-center rounded-md bg-blue-100 p-7 text-[13px] text-blue-900 shadow-blue-200 hover:bg-blue-200/50 hover:shadow-blue-400/60"
          >
            {option.icon}
            {t_contentTypes(`buttons.titles.${option.value}`)}
          </Button>
        ))}
      </div>
    </>
  );
}
