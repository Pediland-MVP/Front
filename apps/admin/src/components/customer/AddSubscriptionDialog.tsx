import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { DurationResponse, PlanResponse } from '@/types/subscription';
import api, { fetcher } from '@/hooks/swr/api-client';
import { useState } from 'react';
import { formatNumber } from '@/lib/formatNumber';
import { onInputP2EHandler } from '@/lib/p2eNumber';
import { toast } from 'sonner';

const FormSchema = z.object({
  planId: z.string().min(1, 'اشتراک را انتخاب کنید.'),
  planDurationId: z.string().min(1, 'مدت را انتخاب کنید.'),
  price: z.number().optional(),
  finalPrice: z.number().optional(),
});

interface AddSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const AddSubscriptionDialog = ({
  open,
  onOpenChange,
  userId,
}: AddSubscriptionDialogProps) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      planId: '',
      planDurationId: '',
      price: 0,
      finalPrice: undefined,
    },
  });

  const { data: plansData, isLoading: isPlansLoading } = useSWR<PlanResponse>(`/plans`, fetcher);

  const { data: durationsData, isLoading: isDurationsLoading } = useSWR<DurationResponse>(
    selectedPlanId ? `/plans/planDurations?planId=${selectedPlanId}` : null,
    fetcher,
  );

  const handleAddSubscription = async (data: z.infer<typeof FormSchema>) => {
    const price = data.finalPrice ?? data.price;
    const payload = {
      userId,
      planDurationId: data.planDurationId,
      price,
    };

    try {
      await api.post('/subscriptions', payload);
      onOpenChange(false);
      toast.success('اشتراک با موفقیت اضافه شد.');
    } catch (error) {
      console.error(error);
      toast.error('خطا در اضافه کردن اشتراک.');
    } finally {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>افزودن اشتراک</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleAddSubscription)}
            className="grid gap-x-2 gap-y-3 md:grid-cols-3"
          >
            <FormField
              control={form.control}
              name="planId"
              render={({ field }) => (
                <FormItem className="md:col-span-3">
                  <FormLabel>اشتراک</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val);
                      setSelectedPlanId(val);
                      // form.setValue("durationId", "");
                      // form.setValue("price", 0);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اشتراک را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {plansData?.data.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="planDurationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مدت</FormLabel>
                  <Select
                    disabled={!selectedPlanId || isDurationsLoading}
                    onValueChange={(val) => {
                      field.onChange(val);
                      const selected = durationsData?.data.find((d) => d.id === Number(val));
                      if (selected?.price) {
                        form.setValue('price', selected.price);
                      }
                    }}
                    value={field.value ? field.value.toString() : undefined}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="مدت را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationsData?.data.map((duration) => (
                        <SelectItem key={duration.id} value={duration.id.toString()}>
                          {duration.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>قیمت</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      readOnly
                      className="cursor-not-allowed bg-gray-100 text-right"
                      value={`${formatNumber(field.value ?? 0) ?? ''} تومان`}
                      onChange={() => {}}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="finalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>قیمت نهایی</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      onInput={onInputP2EHandler}
                      value={
                        field.value !== undefined && field.value !== null
                          ? String(formatNumber(field.value))
                          : ''
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        field.onChange(raw ? Number(raw) : undefined);
                      }}
                      className="text-right"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-3 flex gap-2 md:col-span-3">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'در حال ثبت...' : 'افزودن اشتراک'}
              </Button>

              <Button
                type="button"
                color="cancel"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
              >
                انصراف
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
