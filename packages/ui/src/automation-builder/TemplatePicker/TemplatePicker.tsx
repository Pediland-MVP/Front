'use client';

import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { TemplateCard } from './TemplateCard';

export interface TemplateSummary {
  id: string;
  templateTitle: string;
  templateDescription: string | null;
  templateImage: { url: string } | null;
}

export interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: TemplateSummary[];
  isLoading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (template: TemplateSummary) => void;
  searchPlaceholder: string;
  emptyLabel: string;
}

export function TemplatePicker({
  open,
  onOpenChange,
  templates,
  isLoading,
  search,
  onSearchChange,
  onSelect,
  searchPlaceholder,
  emptyLabel,
}: TemplatePickerProps) {
  const isMobile = useMediaQuery('only screen and (max-width : 768px)');

  const body = (
    <div className="flex flex-col gap-3" dir="rtl">
      <Input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
      />
      {isLoading ? (
        <LoaderSpin />
      ) : templates.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">{emptyLabel}</p>
      ) : (
        <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto md:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => onSelect(template)}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader dir="rtl" className="text-right">
            <DrawerTitle>{searchPlaceholder}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-6">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{searchPlaceholder}</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
