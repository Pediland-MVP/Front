'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import useSWR from 'swr';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ChevronDown, CheckCircle2, XCircle } from 'lucide-react';

import api from '@/hooks/swr/api-client';
import { cn } from '@/lib/utils';
import { onInputP2EHandler } from '@/lib/p2eNumber';
import { formatNumber } from '@/lib/formatNumber';
import { useSelectOnFocus } from '@/hooks/useSelectOnFocus';
import { statusLabels } from '@/constants/user-status';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

interface TestEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpointId: string;
}

// The backend `UserStatusEnum` (packages/entities/src/users/user.enum.ts) has 9 values.
// Reuses the labels already shown on the real customer list (src/constants/user-status.ts)
// so this dropdown looks familiar — 'removed' has no label there yet (a pre-existing gap
// on that page, out of scope here), so it gets one just for this dropdown.
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'new', label: statusLabels.new },
  { value: 'onboarding', label: statusLabels.onboarding },
  { value: 'needed', label: statusLabels.needed },
  { value: 'semiActive', label: statusLabels.semiActive },
  { value: 'active', label: statusLabels.active },
  { value: 'keyUser', label: statusLabels.keyUser },
  { value: 'inactive', label: statusLabels.inactive },
  { value: 'lost', label: statusLabels.lost },
  { value: 'removed', label: 'حذف‌شده' },
];

interface TestEventResultData {
  subscribed: boolean;
  ok: boolean;
  responseStatus: number;
  responseBody: string | null;
  payload: Record<string, unknown>;
}

const FormSchema = z.object({
  type: z.string().min(1),
  status: z.string().min(1),
  firstname: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().optional(),
  submittedInstagramUsername: z.string().optional(),
  submittedInstagramFollowersCount: z.number().optional(),
  workspaceName: z.string().optional(),
  workspaceInstagramUsername: z.string().optional(),
  workspaceSubscriptionStatus: z.string().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

const DEFAULT_VALUES: FormValues = {
  type: '',
  status: 'active',
  firstname: 'Test',
  mobile: '09120000000',
  email: '',
  submittedInstagramUsername: '',
  submittedInstagramFollowersCount: undefined,
  workspaceName: 'Test Workspace',
  workspaceInstagramUsername: '',
  workspaceSubscriptionStatus: '',
};

export function TestEventDialog({ open, onOpenChange, endpointId }: TestEventDialogProps) {
  const t = useTranslations('Webhooks');
  const { onFocus } = useSelectOnFocus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<TestEventResultData | null>(null);
  const [showPayload, setShowPayload] = useState(false);

  const { data: typesData } = useSWR<{ data: { types: string[] } }>(
    open ? '/analytics-webhooks/event-types' : null,
  );
  const types = typesData?.data?.types ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const resetAll = () => {
    form.reset(DEFAULT_VALUES);
    setResult(null);
    setShowPayload(false);
  };

  const submit = async (data: FormValues) => {
    setIsSubmitting(true);
    setResult(null);
    try {
      const hasWorkspace = !!(
        data.workspaceName?.trim() || data.workspaceInstagramUsername?.trim()
      );
      const res = await api.post<{ data: TestEventResultData }>(
        `/analytics-webhooks/${endpointId}/test-event`,
        {
          type: data.type,
          user: {
            status: data.status,
            firstname: data.firstname?.trim() || undefined,
            mobile: data.mobile?.trim() || undefined,
            email: data.email?.trim() || undefined,
            submittedInstagramUsername: data.submittedInstagramUsername?.trim() || undefined,
            submittedInstagramFollowersCount: data.submittedInstagramFollowersCount,
          },
          workspace: hasWorkspace
            ? {
                name: data.workspaceName?.trim() || undefined,
                instagramUsername: data.workspaceInstagramUsername?.trim() || undefined,
                subscriptionStatus: data.workspaceSubscriptionStatus || undefined,
              }
            : undefined,
        },
      );
      setResult(res.data.data);
      if (res.data.data.ok) toast.success(t('testResultSuccess'));
      else toast.error(t('testResultFailed'));
    } catch {
      toast.error(t('toastError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetAll();
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{t('testEventTitle')}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">{t('testEventDescription')}</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('testEventType')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('testEventTypePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            <div className="text-sm font-medium">{t('testEventUserSection')}</div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('testEventUserStatus')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('testEventFirstname')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('testEventMobile')}</FormLabel>
                    <FormControl>
                      <Input dir="ltr" inputMode="numeric" onInput={onInputP2EHandler} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('testEventEmail')}</FormLabel>
                  <FormControl>
                    <Input dir="ltr" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="submittedInstagramUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('testEventIgUsername')}</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="submittedInstagramFollowersCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('testEventIgFollowers')}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        onInput={onInputP2EHandler}
                        onFocus={onFocus}
                        value={
                          field.value === undefined ? '' : String(formatNumber(field.value) ?? '')
                        }
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? undefined : +e.target.value)
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />
            <div className="text-sm font-medium">{t('testEventWorkspaceSection')}</div>
            <p className="text-muted-foreground text-xs">{t('testEventWorkspaceHint')}</p>

            <FormField
              control={form.control}
              name="workspaceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('testEventWorkspaceName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="workspaceInstagramUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('testEventWorkspaceIg')}</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workspaceSubscriptionStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('testEventSubscriptionStatus')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('testEventSubscriptionNone')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">{t('subscriptionActive')}</SelectItem>
                        <SelectItem value="reserved">{t('subscriptionReserved')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {result ? (
              <div
                className={cn(
                  'space-y-2 rounded-md border p-3',
                  result.ok
                    ? 'border-green-600/30 bg-green-50 dark:bg-green-950/20'
                    : 'border-destructive/30 bg-destructive/5',
                )}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  {result.ok ? (
                    <CheckCircle2 className="size-4 text-green-600" />
                  ) : (
                    <XCircle className="text-destructive size-4" />
                  )}
                  {result.ok ? t('testResultSuccess') : t('testResultFailed')}
                  <Badge variant="outline" className="mr-auto font-mono">
                    {result.responseStatus || '—'}
                  </Badge>
                </div>
                {!result.subscribed ? (
                  <p className="text-xs text-amber-700">{t('testResultNotSubscribed')}</p>
                ) : null}
                <Collapsible open={showPayload} onOpenChange={setShowPayload}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
                    >
                      <ChevronDown
                        className={cn('size-3 transition-transform', showPayload && 'rotate-180')}
                      />
                      {t('testResultShowPayload')}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre
                      dir="ltr"
                      className="bg-muted mt-2 max-h-64 overflow-auto rounded p-2 text-[11px]"
                    >
                      {JSON.stringify(result.payload, null, 2)}
                    </pre>
                    {result.responseBody ? (
                      <>
                        <div className="mt-2 text-xs font-medium">
                          {t('testResultResponseBody')}
                        </div>
                        <pre
                          dir="ltr"
                          className="bg-muted mt-1 max-h-32 overflow-auto rounded p-2 text-[11px]"
                        >
                          {result.responseBody}
                        </pre>
                      </>
                    ) : null}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {t('testEventSubmit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
