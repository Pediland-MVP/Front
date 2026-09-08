'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import useSWR from 'swr';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ChevronDown, CheckCircle2, Loader2, XCircle } from 'lucide-react';

import api from '@/hooks/swr/api-client';
import { cn } from '@/lib/utils';
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

/**
 * A test event is INJECTED into the real pipeline, so the operator picks REAL rows here
 * instead of typing made-up values. Which pickers are required follows the event's parent
 * namespace, mirroring apps/admin/src/analyticsWebhooks/analyticsWebhooks.service.ts —
 * because that is what decides whether the n8n Wait node's snapshot refresh can resolve.
 */
const parentOf = (type: string) => type.split('.')[0];
const needsWorkspace = (type: string) => ['workspace', 'automation'].includes(parentOf(type));
const needsAutomation = (type: string) => parentOf(type) === 'automation';

/** Delivery states that will never change again — polling stops on these. */
const TERMINAL_STATUSES = ['delivered', 'dead_lettered', 'cancelled'];

interface InjectResultData {
  eventId: string;
  deliveryId: string;
  payload: Record<string, unknown>;
  pollIntervalSeconds: number;
  snapshotSupported: boolean;
}

interface DeliveryStatusData {
  id: string;
  status: string;
  origin: string;
  attempts: number;
  responseStatus: number | null;
  lastError: string | null;
  deliveredAt: string | null;
  nextAttemptAt: string | null;
}

interface UserOption {
  id: string;
  firstname?: string | null;
  lastname?: string | null;
  mobile?: string | null;
}

interface WorkspaceOption {
  workspaceId: string;
  workspaceName: string;
  isPersonal: boolean;
}

interface AutomationOption {
  id: string;
  title: string;
  enabled: boolean;
}

const FormSchema = z
  .object({
    type: z.string().min(1),
    userId: z.string().min(1),
    workspaceId: z.string().optional(),
    automationId: z.string().optional(),
  })
  .refine((v) => !needsWorkspace(v.type) || !!v.workspaceId, {
    path: ['workspaceId'],
    message: 'required',
  })
  .refine((v) => !needsAutomation(v.type) || !!v.automationId, {
    path: ['automationId'],
    message: 'required',
  });
type FormValues = z.infer<typeof FormSchema>;

const DEFAULT_VALUES: FormValues = {
  type: '',
  userId: '',
  workspaceId: '',
  automationId: '',
};

export function TestEventDialog({ open, onOpenChange, endpointId }: TestEventDialogProps) {
  const t = useTranslations('Webhooks');
  // Repo convention (CLAUDE.md §10): backend error codes are translated via ERROR_CODES.
  const t_ec = useTranslations('ERROR_CODES');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<InjectResultData | null>(null);
  const [showPayload, setShowPayload] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const type = form.watch('type');
  const userId = form.watch('userId');
  const workspaceId = form.watch('workspaceId');

  // Debounced so typing a name does not fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(userSearch.trim()), 350);
    return () => clearTimeout(id);
  }, [userSearch]);

  const { data: typesData } = useSWR<{ data: { types: string[] } }>(
    open ? '/analytics-webhooks/event-types' : null,
  );
  const types = typesData?.data?.types ?? [];

  const { data: usersData, isLoading: usersLoading } = useSWR<{ items: UserOption[] }>(
    open
      ? `/users?limit=20&page=1${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`
      : null,
  );
  // Memoized: it feeds a useMemo dep list, and a fresh `[]` each render would thrash it.
  const users = useMemo(() => usersData?.items ?? [], [usersData]);

  const { data: workspacesData } = useSWR<{ items: WorkspaceOption[] }>(
    open && userId && needsWorkspace(type) ? `/users/${userId}/workspaces?page=1&limit=50` : null,
  );
  const workspaces = workspacesData?.items ?? [];

  const { data: automationsData } = useSWR<{ data: { items: AutomationOption[] } }>(
    open && workspaceId && needsAutomation(type)
      ? `/analytics-webhooks/test-event-automations/${workspaceId}`
      : null,
  );
  const automations = automationsData?.data?.items ?? [];

  // Delivery is asynchronous — core's poller picks the row up on its next tick — so watch
  // the real delivery row instead of pretending the POST above sent anything.
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatusData | null>(null);
  const isTerminal = !!deliveryStatus && TERMINAL_STATUSES.includes(deliveryStatus.status);
  const { data: deliveryData } = useSWR<{ data: DeliveryStatusData }>(
    result && !isTerminal
      ? `/analytics-webhooks/${endpointId}/test-event/${result.deliveryId}`
      : null,
    { refreshInterval: 3000 },
  );
  useEffect(() => {
    if (deliveryData?.data) setDeliveryStatus(deliveryData.data);
  }, [deliveryData]);

  // Changing the event type can make an already-picked id irrelevant (or required).
  // Clear the ones that no longer apply so a stale value is never submitted.
  useEffect(() => {
    if (!needsWorkspace(type)) form.setValue('workspaceId', '');
    if (!needsAutomation(type)) form.setValue('automationId', '');
  }, [type, form]);
  useEffect(() => {
    form.setValue('automationId', '');
  }, [workspaceId, form]);

  const selectedUserLabel = useMemo(() => {
    const u = users.find((x) => x.id === userId);
    if (!u) return '';
    return `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || (u.mobile ?? u.id);
  }, [users, userId]);

  const resetAll = () => {
    form.reset(DEFAULT_VALUES);
    setResult(null);
    setDeliveryStatus(null);
    setShowPayload(false);
    setUserSearch('');
  };

  const submit = async (data: FormValues) => {
    setIsSubmitting(true);
    setResult(null);
    setDeliveryStatus(null);
    try {
      const res = await api.post<{ data: InjectResultData }>(
        `/analytics-webhooks/${endpointId}/test-event`,
        {
          type: data.type,
          userId: data.userId,
          workspaceId: data.workspaceId || undefined,
          automationId: data.automationId || undefined,
        },
      );
      setResult(res.data.data);
      toast.success(t('testEventInjected'));
    } catch (err: any) {
      toast.error(t_ec(err?.response?.data?.code) || t('toastError'));
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
                      {types.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            <div className="text-sm font-medium">{t('testEventSubjectsSection')}</div>
            <p className="text-muted-foreground text-xs">{t('testEventSubjectsHint')}</p>

            <FormItem>
              <FormLabel>{t('testEventUserSearch')}</FormLabel>
              <FormControl>
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={t('testEventUserSearchPlaceholder')}
                />
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('testEventUser')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={usersLoading ? t('loading') : t('testEventUserPlaceholder')}
                        >
                          {selectedUserLabel}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {`${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.id}
                          {u.mobile ? ` — ${u.mobile}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {needsWorkspace(type) ? (
              <FormField
                control={form.control}
                name="workspaceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('testEventWorkspace')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!userId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('testEventWorkspacePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workspaces.map((w) => (
                          <SelectItem key={w.workspaceId} value={w.workspaceId}>
                            {w.workspaceName}
                            {w.isPersonal ? ` (${t('personalWorkspace')})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {needsAutomation(type) ? (
              <FormField
                control={form.control}
                name="automationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('testEventAutomation')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!workspaceId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('testEventAutomationPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {automations.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {result ? (
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center gap-2">
                  {isTerminal && deliveryStatus?.status === 'delivered' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : isTerminal ? (
                    <XCircle className="text-destructive h-4 w-4" />
                  ) : (
                    <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  )}
                  <span className="text-sm font-medium">
                    {t(`deliveryStatus.${deliveryStatus?.status ?? 'queued'}` as never)}
                  </span>
                  <Badge variant="outline">{t('testEventOriginTest')}</Badge>
                </div>

                {/* The delivery is picked up by core's poller, not by the request above. */}
                {!isTerminal ? (
                  <p className="text-muted-foreground text-xs">
                    {t('testEventDispatchPending', { seconds: result.pollIntervalSeconds })}
                  </p>
                ) : null}

                {!result.snapshotSupported ? (
                  <p className="text-xs text-amber-600">{t('testEventNoSnapshotAdapter')}</p>
                ) : null}

                {deliveryStatus?.responseStatus != null ? (
                  <div className="text-xs">
                    {t('testResultResponseStatus')}: {deliveryStatus.responseStatus}
                  </div>
                ) : null}
                {deliveryStatus?.lastError ? (
                  <div className="text-destructive text-xs">{deliveryStatus.lastError}</div>
                ) : null}

                <div className="text-muted-foreground text-xs" dir="ltr">
                  eventId: {result.eventId}
                </div>

                <Collapsible open={showPayload} onOpenChange={setShowPayload}>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="px-0">
                      {t('testResultShowPayload')}
                      <ChevronDown
                        className={cn('ms-1 h-4 w-4 transition', showPayload && 'rotate-180')}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre
                      dir="ltr"
                      className="bg-muted mt-1 max-h-48 overflow-auto rounded p-2 text-[11px]"
                    >
                      {JSON.stringify(result.payload, null, 2)}
                    </pre>
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
