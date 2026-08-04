'use client';

import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { ContentTypeOption, contentTypeOptions } from './ContentTypeOptions';

type ChooseAutomationTypeProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (option: ContentTypeOption) => any;
  /** Defaults to the full `contentTypeOptions` list. `Contents.tsx` passes a filtered
   * list (dropping the `'template'` entry) when rendered in `mode="template"` — a
   * template can't embed another template. */
  options?: ContentTypeOption[];
};

export function ChooseAutomationType({
  open,
  onOpenChange,
  onSelect,
  options = contentTypeOptions,
}: ChooseAutomationTypeProps) {
  const t_contentTypes = useTranslations('Automations.Contents.Types');

  if (!open) return null;

  const handleSelect = (option: ContentTypeOption) => {
    onSelect(option);
    onOpenChange(false);
  };

  return (
    <>
      <Alert variant="note" className="col-span-5">
        <AlertTitle>{t_contentTypes('select_your_type')}</AlertTitle>
      </Alert>
      <div className="grid w-full grid-cols-5 justify-start gap-x-1.5 gap-y-2.5">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option)}
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
