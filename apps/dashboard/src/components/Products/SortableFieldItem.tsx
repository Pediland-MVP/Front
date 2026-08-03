'use client';

import { cn } from '@/lib/utils';
import { ProductFieldTypeEnum } from '@/types/product.enum';
import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

import {
  Button,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowsVerticalIcon } from '@phosphor-icons/react/dist/ssr/ArrowsVertical';
import { Trash2Icon } from 'lucide-react';

export const SortableFieldItem = ({
  field,
  index,
  removeCustomField,
}: {
  field: any;
  index: number;
  removeCustomField: (id: string) => void;
}) => {
  const t = useTranslations('Products.Form.Product');
  const form = useFormContext();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field._xid,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="_item flex items-center gap-1.5">
      <div {...attributes} {...listeners} className="cursor-grab touch-none active:cursor-grabbing">
        <ArrowsVerticalIcon size={16} className="text-gray-500" />
      </div>

      <FormField
        control={form.control}
        name={`fields.${index}.type`}
        render={({ field: typeField }) => (
          <FormItem className="space-y-0">
            <Select value={typeField.value} onValueChange={typeField.onChange}>
              <SelectTrigger className="w-auto gap-1 pr-2 pl-1.5">
                <SelectValue placeholder={t('field_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ProductFieldTypeEnum.TEXT}>{t('short_text')}</SelectItem>
                  <SelectItem value={ProductFieldTypeEnum.TEXTAREA}>{t('long_text')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`fields.${index}.label`}
        render={({ field: labelField }) => (
          <FormItem className="flex-1 space-y-0">
            <FormControl>
              <Input placeholder={t('field_title')} {...labelField} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`fields.${index}.isRequired`}
        render={({ field: statusField }) => (
          <FormItem className="space-y-0">
            <Select
              value={`${statusField.value}`}
              onValueChange={(value) => statusField.onChange(value === 'true' ? true : false)}
            >
              <SelectTrigger className="w-auto gap-1 pr-2 pl-1.5">
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="false">{t('optional')}</SelectItem>
                  <SelectItem value="true">{t('required')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => removeCustomField(field._xid)}
      >
        <Trash2Icon className="text-destructive" />
      </Button>
    </div>
  );
};
