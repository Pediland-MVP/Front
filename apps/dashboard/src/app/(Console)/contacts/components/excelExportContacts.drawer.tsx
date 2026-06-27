'use client';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';

// Import the specified date picker components
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import DateObject from 'react-date-object';
import persian_fa from 'react-date-object/locales/persian_fa';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/hooks/swr/api-client';
import { toast } from 'sonner';
import { AxiosError, AxiosResponse } from 'axios';
import { ExceptionMessage } from '@/types/exceptionMessage';
import { IResponseMessage } from '@/types/responseMessage';
import { useState } from 'react';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';

// Define a proper type for DateObject
type DateObjectType =
  | DateObject
  | {
      unix: number;
      toDate: () => Date;
      format: (format: string) => string;
    };

// Custom zod refinement for DateObject
const isDateObject = (value: any): value is DateObjectType => {
  return (
    value instanceof DateObject ||
    (value && typeof value.toDate === 'function' && typeof value.unix === 'number')
  );
};

// Create a schema factory function to use translations
const createFormSchema = (t: ReturnType<typeof useTranslations>) => {
  return z.object({
    startDate: z.custom<DateObjectType>((val) => isDateObject(val), {
      message: t('form.startDate.error'),
    }),
    endDate: z.custom<DateObjectType>((val) => isDateObject(val), {
      message: t('form.endDate.error'),
    }),
    email: z.string().email({
      message: t('form.email.error'),
    }),
    count: z.coerce
      .number()
      .max(10000, {
        message: t('form.count.error'),
      })
      .optional()
      .default(10000),
    justHaveNumber: z.boolean().default(false).optional(),
  });
};

interface ExcelExportContactsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExcelExportContactsDrawer({ open, onOpenChange }: ExcelExportContactsDrawerProps) {
  const t = useTranslations('Contacts.ExcelExport');
  const t_ec = useTranslations('ERROR_CODES');

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Create the schema with translations
  const formSchema = createFormSchema(t);
  type FormValues = z.infer<typeof formSchema>;

  // Initialize the form with DateObject defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: new DateObject({
        calendar: persian,
        locale: persian_fa,
      }) as DateObjectType,
      endDate: new DateObject({
        calendar: persian,
        locale: persian_fa,
      }) as DateObjectType,
      count: 10000,
      justHaveNumber: false,
    },
  });

  // Form submission handler
  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    // Convert DateObjects to ISO strings
    const payload = {
      ...values,
      startDate:
        values.startDate instanceof DateObject
          ? values.startDate.toDate().toISOString()
          : values.startDate,
      endDate:
        values.endDate instanceof DateObject
          ? values.endDate.toDate().toISOString()
          : values.endDate,
    };

    await api
      .post('/leads/excelExport', payload)
      .then((res: AxiosResponse<IResponseMessage>) => {
        toast.success(t('success'));
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        const error = t_ec(e.code);
        toast.error(error);
      })
      .finally(() => setIsLoading(false));
    onOpenChange(false);
    form.reset();
  }

  // Date picker styles
  const datePickerStyles = {
    width: '100%',
    height: '40px',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid hsl(var(--input))',
    fontSize: '14px',
    backgroundColor: 'transparent',
    color: 'hsl(var(--foreground))',
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto sm:max-w-[425px]">
        <DrawerHeader>
          <DrawerTitle>{t('title')}</DrawerTitle>
          <DrawerDescription>{t('description')}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('form.startDate.label')}</FormLabel>
                    <FormControl>
                      <Controller
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <DatePicker
                            value={
                              field.value
                                ? new DateObject(+field.value)
                                    .setLocale(persian_fa)
                                    .setCalendar(persian)
                                    .format('YYYY/MM/DD')
                                : ''
                            }
                            onChange={(date) => {
                              field.onChange(date);
                            }}
                            calendar={persian}
                            locale={persian_fa}
                            calendarPosition="bottom-right"
                            style={datePickerStyles}
                          />
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('form.endDate.label')}</FormLabel>
                    <FormControl>
                      <Controller
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <DatePicker
                            value={
                              field.value
                                ? new DateObject(+field.value)
                                    .setLocale(persian_fa)
                                    .setCalendar(persian)
                                    .format('YYYY/MM/DD')
                                : ''
                            }
                            onChange={(date) => {
                              field.onChange(date);
                            }}
                            calendar={persian}
                            locale={persian_fa}
                            calendarPosition="bottom-right"
                            style={datePickerStyles}
                          />
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.email.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('form.email.placeholder')} {...field} />
                    </FormControl>
                    <FormDescription>{t('form.email.description')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.count.label')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('form.count.placeholder')}
                        {...field}
                        onChange={(e) => {
                          const value =
                            e.target.value === '' ? undefined : Number.parseInt(e.target.value, 10);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>{t('form.count.description')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="justHaveNumber"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t('form.justHaveNumber.label')}</FormLabel>
                      <FormDescription>{t('form.justHaveNumber.description')}</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DrawerFooter>
                <ButtonLoading isLoading={isLoading} type="submit">
                  {t('buttons.export')}
                </ButtonLoading>
                <DrawerClose asChild>
                  <Button variant="outline">{t('buttons.cancel')}</Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
