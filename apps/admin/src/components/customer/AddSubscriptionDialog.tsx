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
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatNumber } from '@/lib/formatNumber';
import { onInputP2EHandler } from '@/lib/p2eNumber';
import { toast } from 'sonner';

interface WorkspaceInstagramOption {
  id: string;
  username: string;
}

interface WorkspaceOption {
  workspaceId: string;
  workspaceName: string;
  isPersonal: boolean;
  role: 'owner' | 'member';
  instagrams: WorkspaceInstagramOption[];
}

const FormSchema = z.object({
  workspaceId: z.string().min(1, 'ورک‌اسپیس را انتخاب کنید.'),
  instagramId: z.string().optional(),
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

  const t_ec = useTranslations('ERROR_CODES');

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      workspaceId: '',
      instagramId: '',
      planId: '',
      planDurationId: '',
      price: 0,
      finalPrice: undefined,
    },
  });

  const { data: workspacesData, isLoading: isWorkspacesLoading } = useSWR<{
    items: WorkspaceOption[];
  }>(open ? `/users/${userId}/workspaces?page=1&limit=100` : null, fetcher);

  // Only workspaces this customer OWNS. Charging one they merely belong to would credit
  // a different customer's account and show up on that owner's page instead.
  const ownedWorkspaces = useMemo(
    () => (workspacesData?.items ?? []).filter((w) => w.role === 'owner'),
    [workspacesData],
  );

  const selectedWorkspaceId = form.watch('workspaceId');

  const availableInstagrams = useMemo(
    () => ownedWorkspaces.find((w) => w.workspaceId === selectedWorkspaceId)?.instagrams ?? [],
    [ownedWorkspaces, selectedWorkspaceId],
  );

  // Which workspaceId we've already resolved the page (instagramId) defaults for. This is
  // what lets the dialog PRESERVE the operator's selections across close/reopen: closing
  // pauses the workspaces SWR key, which makes `availableInstagrams` momentarily collapse
  // to [] (and then pop back once reopened/revalidated) even though nothing about the
  // workspace actually changed. Without this guard, the page-defaults effect below would
  // treat that flicker as "the list changed" and clear (or re-auto-select over) whatever
  // the operator had deliberately chosen - including a deliberate "no page" (pool) choice.
  // Reset to null whenever the workspace actually changes (see that effect) or the dialog
  // is opened for a different customer (see the userId-reset effect further down).
  const instagramDefaultsAppliedRef = useRef<string | null>(null);

  // Exactly one owned workspace -> preselect it, so the common case needs no clicks.
  // Only ever SETS an empty value, never clears an existing one, so it's already safe
  // across the close/reopen SWR flicker described above.
  useEffect(() => {
    if (ownedWorkspaces.length === 1 && !form.getValues('workspaceId')) {
      form.setValue('workspaceId', ownedWorkspaces[0].workspaceId);
    }
  }, [ownedWorkspaces, form]);

  // Exactly one page in the chosen workspace -> preselect it. Also clears a page that
  // belonged to a previously selected workspace and is no longer valid. Runs at most once
  // per selectedWorkspaceId (tracked via instagramDefaultsAppliedRef) so a later re-render
  // with the SAME workspace - e.g. the SWR list flickering to [] and back while the dialog
  // closes/reopens, or a background revalidation - never touches instagramId again. That is
  // what keeps a deliberate "بدون پیج خاص" (pool) choice from being silently overwritten.
  useEffect(() => {
    if (!selectedWorkspaceId) return;
    if (instagramDefaultsAppliedRef.current === selectedWorkspaceId) return;

    const current = form.getValues('instagramId');
    const stillValid = availableInstagrams.some((ig) => ig.id === current);
    if (current && !stillValid) {
      form.setValue('instagramId', '');
    }
    if (availableInstagrams.length === 1 && !stillValid) {
      form.setValue('instagramId', availableInstagrams[0].id);
    }
    instagramDefaultsAppliedRef.current = selectedWorkspaceId;
  }, [selectedWorkspaceId, availableInstagrams, form]);

  // Opening the dialog for a DIFFERENT customer must never carry over the previous
  // customer's selections - the component can stay mounted across userId changes (the
  // parent just swaps the prop and re-opens). Reset the form and the page-defaults tracker
  // back to a clean slate whenever userId changes, independent of open/close.
  const previousUserIdRef = useRef(userId);
  useEffect(() => {
    if (previousUserIdRef.current === userId) return;
    previousUserIdRef.current = userId;
    form.reset();
    setSelectedPlanId('');
    instagramDefaultsAppliedRef.current = null;
  }, [userId, form]);

  const { data: plansData, isLoading: isPlansLoading } = useSWR<PlanResponse>(`/plans`, fetcher);

  const { data: durationsData, isLoading: isDurationsLoading } = useSWR<DurationResponse>(
    selectedPlanId ? `/plans/planDurations?planId=${selectedPlanId}` : null,
    fetcher,
  );

  const handleAddSubscription = async (data: z.infer<typeof FormSchema>) => {
    const price = data.finalPrice ?? data.price;
    const payload = {
      userId,
      workspaceId: data.workspaceId,
      // Empty string means "no specific page" -> untargeted pool sub.
      ...(data.instagramId ? { instagramId: data.instagramId } : {}),
      planDurationId: data.planDurationId,
      price,
    };

    try {
      await api.post('/subscriptions', payload);
      onOpenChange(false);
      toast.success('اشتراک با موفقیت اضافه شد.');
      form.reset();
    } catch (error) {
      const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
      toast.error((code && t_ec(code)) || 'خطا در اضافه کردن اشتراک.');
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
              name="workspaceId"
              render={({ field }) => (
                <FormItem className="md:col-span-3">
                  <FormLabel>ورک‌اسپیس</FormLabel>
                  <Select
                    disabled={isWorkspacesLoading || ownedWorkspaces.length === 0}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="ورک‌اسپیس را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {ownedWorkspaces.map((ws) => (
                        <SelectItem key={ws.workspaceId} value={ws.workspaceId}>
                          {ws.workspaceName}
                          {ws.isPersonal ? ' (شخصی)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isWorkspacesLoading && ownedWorkspaces.length === 0 && (
                    <p className="text-xs text-rose-600">
                      این کاربر هیچ ورک‌اسپیسی ندارد و قابل شارژ نیست.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instagramId"
              render={({ field }) => (
                <FormItem className="md:col-span-3">
                  <FormLabel>پیج اینستاگرام (اختیاری)</FormLabel>
                  <Select
                    disabled={!selectedWorkspaceId}
                    onValueChange={(val) => field.onChange(val === 'none' ? '' : val)}
                    value={field.value ? field.value : 'none'}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="بدون پیج خاص (استخر)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون پیج خاص (استخر)</SelectItem>
                      {availableInstagrams.map((ig) => (
                        <SelectItem key={ig.id} value={ig.id}>
                          @{ig.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    {field.value
                      ? 'اگر این پیج اشتراک فعال داشته باشد، این شارژ رزرو می‌شود و بعد از پایان اشتراک فعلی شروع می‌شود.'
                      : 'بدون انتخاب پیج، شارژ به استخر ورک‌اسپیس اضافه می‌شود و هنگام اتصال پیج مصرف می‌شود.'}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || ownedWorkspaces.length === 0}
              >
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
