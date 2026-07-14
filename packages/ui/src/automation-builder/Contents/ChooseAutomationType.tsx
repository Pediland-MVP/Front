'use client';

import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useLocale, useTranslations } from 'next-intl';
import { ContentTypeOption, contentTypeOptions } from './ContentTypeOptions';

type ChooseAutomationTypeProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (option: ContentTypeOption) => any;
};

export function ChooseAutomationType({ open, onOpenChange, onSelect }: ChooseAutomationTypeProps) {
  const t_contentTypes = useTranslations('Automations.Contents.Types');
  const locale = useLocale();
  const isMobile = useMediaQuery('only screen and (max-width : 768px)');

  const handleSelect = (option: ContentTypeOption) => {
    onSelect(option);
    onOpenChange(false);
  };

  const rows = (
    <div className="flex w-full flex-col gap-1" dir="rtl">
      {contentTypeOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="ghost"
          onClick={() => handleSelect(option)}
          className="h-auto w-full items-center justify-start gap-3 rounded-lg p-3"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-900">
            {option.icon}
          </span>
          <span className="flex min-w-0 flex-col items-start gap-0.5">
            <span className="text-sm font-medium whitespace-nowrap">
              {t_contentTypes(`buttons.titles.${option.value}`)}
            </span>
            <span
              className={`text-muted-foreground w-full text-xs font-normal whitespace-normal ${locale === 'fa' ? 'text-right' : 'text-left'}`}
            >
              {t_contentTypes(`buttons.descriptions.${option.value}`)}
            </span>
          </span>
        </Button>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader dir="rtl" className="text-right">
            <DrawerTitle>{t_contentTypes('select_your_type')}</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[70vh] overflow-y-auto p-4 pb-6">{rows}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t_contentTypes('select_your_type')}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">{rows}</div>
      </DialogContent>
    </Dialog>
  );
}
