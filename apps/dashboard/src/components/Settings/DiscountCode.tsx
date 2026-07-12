'use client';

import api from '@/hooks/swr/api-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useSubscriptionStore } from '@/store/subscriptionStore';

import { Button, Form, FormControl, FormField, FormItem, Input } from '@/components/ui';
import { TicketIcon, XIcon } from 'lucide-react';
import { GiftIcon } from '@phosphor-icons/react/dist/ssr';

const schema = z.object({
  code: z.string().min(1),
});

export const DiscountCode = () => {
  const t = useTranslations('UpdateReferralCode');
  const t_ec = useTranslations('ERROR_CODES');
  const [isCodeSubmitting, setIsCodeSubmitting] = useState(false);

  const { active, setActive, discountCode, setDiscountCode } = useSubscriptionStore();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: discountCode || '',
    },
  });

  useEffect(() => {
    form.setValue('code', discountCode || '');
  }, [discountCode, form]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsCodeSubmitting(true);

    try {
      await api.get(`/plans?discountCode=${values.code}`);
      setDiscountCode(values.code);
      toast.success(t('success'));
      setActive({
        ...active,
        showCoupon: false,
      });
    } catch (error: any) {
      toast.error(t_ec(error?.response?.data?.code) || error?.message);
    } finally {
      setIsCodeSubmitting(false);
    }
  };

  const handleClearDiscount = () => {
    setDiscountCode('');
    form.reset({ code: '' });
  };

  if (discountCode) {
    return (
      <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-800 shadow-xs backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <GiftIcon className="h-5 w-5 animate-bounce text-emerald-600" weight="duotone" />
          <div className="flex flex-col gap-0.5 text-right">
            <span className="text-[11px] leading-none text-emerald-600/80">کد تخفیف اعمال شد</span>
            <span className="text-sm font-bold tracking-wider">{discountCode}</span>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearDiscount}
          className="h-8 gap-1 rounded-lg px-2 text-xs font-medium text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
        >
          <XIcon className="h-4 w-4" />
          {t('delete')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-start">
      {active.showCoupon ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-center gap-2">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => {
                return (
                  <FormItem className="flex-1">
                    <FormControl>
                      <div className="relative flex items-center">
                        <TicketIcon className="text-muted-foreground absolute right-3 h-4 w-4" />
                        <Input
                          type="text"
                          placeholder={t('Code.placeholder')}
                          className="shadow-inner-xs h-10 w-full rounded-xl border-violet-200 bg-white pr-9 pl-3 text-sm focus-visible:ring-violet-500"
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                );
              }}
            />
            <Button
              type="submit"
              size="sm"
              className="h-10 shrink-0 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white shadow-md transition-all hover:bg-violet-700 active:scale-95"
              disabled={isCodeSubmitting}
            >
              {isCodeSubmitting ? '...' : t('update')}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl border-gray-200 transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95"
              disabled={isCodeSubmitting}
              onClick={() =>
                setActive({
                  ...active,
                  showCoupon: false,
                })
              }
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      ) : (
        <Button
          variant="ghost"
          onClick={() =>
            setActive({
              ...active,
              showCoupon: true,
            })
          }
          className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-violet-600 transition-all hover:bg-violet-50/50 hover:text-violet-700"
        >
          <TicketIcon className="h-4 w-4 text-violet-500 transition-transform group-hover:rotate-12" />
          {t('have_coupon')}
        </Button>
      )}
    </div>
  );
};
