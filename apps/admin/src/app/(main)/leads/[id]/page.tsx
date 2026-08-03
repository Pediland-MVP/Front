// src/app/leads/[id]/page.tsx
'use client';

import api, { fetcher } from '@/hooks/swr/api-client';
import { useAuth } from '@/hooks/use-auth';
import { useKams } from '@/hooks/use-kams';
import { formatNumber } from '@/lib/formatNumber';
import { MarketingLead } from '@/types/lead';
import { User } from '@/types/user';
import { zodResolver } from '@hookform/resolvers/zod';
import { use, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import useSWR from 'swr';
import z from 'zod';
import dayjs from '@/lib/dayjs-jalali';
import { cn } from '@/lib/utils';
import React from 'react';

// UI Imports
import { FetchError } from '@/components/fetch-error';
import { Loading } from '@/components/loading';
import { StatusBadge } from '@/components/table/status-badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ChatCenteredTextIcon } from '@phosphor-icons/react/dist/ssr/ChatCenteredText';
import { CrosshairSimpleIcon } from '@phosphor-icons/react/dist/ssr/CrosshairSimple';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import { PencilSimpleLineIcon } from '@phosphor-icons/react/dist/ssr/PencilSimpleLine';
import { TelegramLogoIcon } from '@phosphor-icons/react/dist/ssr/TelegramLogo';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { WhatsappLogoIcon } from '@phosphor-icons/react/dist/ssr/WhatsappLogo';
import { CheckIcon, PhoneCallIcon } from 'lucide-react';
import { Action } from '@/types/actions';
import { SendSMSDialog } from '@/components/table/dialog-sms';
import DialogFormLead from '../dialog-form-lead';
import DialogDelete from '@/components/dialog-delete';

const FormSchema = z.object({
  status: z.string().min(1, { message: 'وضعیت را انتخاب کنید.' }),
  admin: z.string().min(1),
});

export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [dialogLeadFormOpen, setDialogLeadFormOpen] = useState(false);
  const [dialogDeleteOpen, setDialogDeleteOpen] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [isStatusChanged, setIsStatusChanged] = useState(false);
  const [isAdminChanged, setIsAdminChanged] = useState(false);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>();
  const [actionType, setActionType] = useState<string>('');
  const [marketingLeadNote, setMarketingLeadNote] = useState<string>('');
  const [isMarketingLeadNoteChanged, setIsMarketingLeadNoteChanged] = useState(false);
  const [note, setNote] = useState<string>('');
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsData, setSmsData] = useState<{
    id: string;
    mobile: string;
    name: string;
  } | null>(null);

  const { user } = useAuth();
  const { id } = use(params);
  const {
    data: marketingLead,
    isLoading,
    error,
    mutate: mutateLead,
  } = useSWR<MarketingLead>(`/marketingLeads/${id}`, fetcher);

  const {
    kams,
    isLoading: isKamsLoading,
    isError: kamsError,
  } = useKams({
    roles: 'manager,kam',
    enabled: user?.role !== 'kam',
  });

  const {
    data: actions,
    isLoading: isActionsLoading,
    error: actionsError,
    mutate: mutateActions,
  } = useSWR(`/actions/marketingLead/${id}?limit=15&page=1`, fetcher);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      status: '',
      admin: '',
    },
  });

  useEffect(() => {
    if (marketingLead) {
      form.reset({
        status: marketingLead?.status,
        admin: marketingLead?.marketingLeadsAdmins.find((admin) => admin.isActive)?.adminId,
      });
    }
  }, [marketingLead, form]);

  const handleUpdateStatus = async () => {
    try {
      const status = form.getValues('status');

      await api.patch(`/marketingLeads/status/${id}`, {
        status,
      });

      setIsStatusChanged(false);
      toast.success('وضعیت با موفقیت به‌روز شد.');
    } catch (error) {
      console.error('خطا در آپدیت وضعیت:', error);
      toast.error('خطا در ذخیره‌سازی');
    }
  };

  const handleUpdateAdmin = async () => {
    try {
      const adminId = form.getValues('admin');

      await api.post('/marketingLeads/assignAdmin', {
        adminId,
        marketingLeadIds: [id],
      });

      setIsAdminChanged(false);
      toast.success('مسئول با موفقیت تغییر کرد');
    } catch (error) {
      console.error(error);
      toast.error('خطا در تغییر مسئول');
    }
  };

  const handleAddAction = async () => {
    if (!selectedDate || !actionType || note.trim() === '') {
      toast.error('لطفاً همه‌ی فیلدها را پر کنید.');
      return;
    }

    setIsSavingAction(true);

    const payload = {
      leadOrUserId: id,
      actionDate: selectedDate
        ? new Date(
            Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()),
          ).toISOString()
        : undefined,
      for: 'marketingLead',
      type: actionType,
      description: note.trim(),
      status: 'todo',
    };

    try {
      await api.post('/actions', payload);
      setSelectedDate(undefined);
      setActionType('');
      setNote('');
      await mutateActions();
      await mutateLead();
      toast.success('عملیات با موفقیت ثبت شد.');
    } catch (error) {
      console.error(error);
      toast.error('خطا در ثبت عملیات.');
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    try {
      await api.delete(`/actions/${actionId}`);
      setDialogDeleteOpen(false);
      await mutateActions();
      toast.success('عملیات با موفقیت حذف شد.');
    } catch (error) {
      console.error(error);
      toast.error('خطا در حذف عملیات.');
    }
  };

  useEffect(() => {
    if (marketingLead?.note !== undefined) {
      setMarketingLeadNote(marketingLead.note);
    }
  }, [marketingLead]);

  const handleUpdateNote = async () => {
    try {
      await api.patch(`/marketingLeads/${id}`, { note: marketingLeadNote });
      setIsMarketingLeadNoteChanged(false);
      toast.success('یادداشت با موفقیت به‌روز شد.');
    } catch (error) {
      console.error('خطا در آپدیت یادداشت:', error);
      toast.error('خطا در ذخیره‌سازی');
    }
  };

  const handleOpenSmsDialog = () => {
    if (!marketingLead) return;

    setSmsData({
      id,
      mobile: marketingLead.mobile,
      name: `${marketingLead.firstname} ${marketingLead.lastname}`,
    });
    setSmsDialogOpen(true);
  };

  if (isLoading || isKamsLoading || isActionsLoading) return <Loading />;
  if (error || kamsError || actionsError) return <FetchError />;
  if (!form.getValues('status')) return <p>ارور</p>;

  return (
    <div
      className="flex h-[calc(100vh-40px)] flex-col gap-6 overflow-hidden bg-slate-50/20 p-4 lg:flex-row"
      dir="rtl"
    >
      {/* Left Column: Profile Sidebar */}
      <div className="scrollbar-thin scrollbar-thumb-slate-200 flex w-full shrink-0 flex-col gap-5 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-5 pr-1 shadow-xs lg:w-96">
        {/* Profile Header */}
        <div className="flex flex-col items-center space-y-3 border-b border-slate-100 pb-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-tr from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-md">
            {marketingLead
              ? `${marketingLead.firstname?.[0] || ''}${marketingLead.lastname?.[0] || ''}`
              : 'م'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {!marketingLead?.firstname && !marketingLead?.lastname
                ? 'ثبت نشده است'
                : `${marketingLead?.firstname ?? ''} ${marketingLead?.lastname ?? ''}`}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400" dir="ltr">
              {marketingLead?.mobile || ''}
            </p>
          </div>

          {/* Quick Action Circle Buttons */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <a
              href={`tel:${marketingLead?.mobile}`}
              className="shadow-3xs flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-slate-50 text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-800"
              title="تماس تلفنی"
            >
              <PhoneCallIcon className="h-4 w-4" />
            </a>
            <button
              onClick={handleOpenSmsDialog}
              className="shadow-3xs flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600 transition-all duration-150 hover:bg-blue-100"
              title="ارسال پیامک"
            >
              <ChatCenteredTextIcon size={18} />
            </button>
            <a
              href={`https://t.me/+98${marketingLead?.mobile?.replace(/^0/, '')}`}
              className="shadow-3xs flex h-9 w-9 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sky-600 transition-all duration-150 hover:bg-sky-100"
              target="_blank"
              rel="noopener noreferrer"
              title="تلگرام"
            >
              <TelegramLogoIcon size={18} />
            </a>
            <a
              href={`https://wa.me/98${marketingLead?.mobile?.replace(/^0/, '')}`}
              className="shadow-3xs flex h-9 w-9 items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-600 transition-all duration-150 hover:bg-green-100"
              target="_blank"
              rel="noopener noreferrer"
              title="واتسپ"
            >
              <WhatsappLogoIcon size={18} />
            </a>
          </div>
        </div>

        {/* Instagram Info */}
        {marketingLead?.instagram?.username && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400">اطلاعات اینستاگرام:</h4>
            <a
              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2 text-xs font-semibold text-slate-600 transition-colors hover:text-indigo-600"
              href={`https://instagram.com/${marketingLead.instagram.username}`}
              target="_blank"
              dir="ltr"
            >
              <InstagramLogoIcon size={18} className="shrink-0 text-pink-600" />
              <span>@{marketingLead.instagram.username}</span>
            </a>
            {marketingLead.instagram.name && (
              <p className="px-1 text-xs font-medium text-slate-500">
                {marketingLead.instagram.name}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="shadow-3xs space-y-0.5 rounded-xl border border-slate-100 bg-white p-2 text-center">
                <span className="block text-[10px] text-slate-400">فالوور</span>
                <span className="block font-bold text-slate-800">
                  {formatNumber(marketingLead.instagram.followersCount)}
                </span>
              </div>
              <div className="shadow-3xs space-y-0.5 rounded-xl border border-slate-100 bg-white p-2 text-center">
                <span className="block text-[10px] text-slate-400">فالووینگ</span>
                <span className="block font-bold text-slate-800">
                  {formatNumber(marketingLead.instagram.followsCount)}
                </span>
              </div>
              <div className="shadow-3xs space-y-0.5 rounded-xl border border-slate-100 bg-white p-2 text-center">
                <span className="block text-[10px] text-slate-400">پست</span>
                <span className="block font-bold text-slate-800">
                  {formatNumber(marketingLead.instagram.mediaCount)}
                </span>
              </div>
            </div>
            {marketingLead.category && (
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-xs text-slate-500">دسته‌بندی:</span>
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  {marketingLead.category.name}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Status + Admin Form */}
        <div className="space-y-4">
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold text-slate-500">
                      وضعیت سرنخ
                    </FormLabel>
                    <div className="flex items-center gap-2">
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setIsStatusChanged(true);
                        }}
                        value={field.value}
                        disabled={marketingLead?.status === 'incoming'}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-2xs">
                            <SelectValue placeholder="انتخاب وضعیت">
                              <StatusBadge status={field.value} />
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="follow">
                            <StatusBadge status="follow" />
                          </SelectItem>
                          <SelectItem value="force">
                            <StatusBadge status="force" />
                          </SelectItem>
                          <SelectItem value="failed">
                            <StatusBadge status="failed" />
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {isStatusChanged && (
                        <Button
                          type="button"
                          className="h-9 w-9 shrink-0 rounded-xl p-0"
                          onClick={handleUpdateStatus}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </FormItem>
                )}
              />

              {user?.role !== 'kam' && (
                <FormField
                  control={form.control}
                  name="admin"
                  render={({ field }) => {
                    const selectedKam = kams.find((kam: User) => kam.id === field.value);
                    const adminKam = marketingLead?.marketingLeadsAdmins.find((a) => a.isActive);
                    const adminFullName = adminKam
                      ? `${adminKam.admin.firstname} ${adminKam.admin.lastname}`
                      : 'بدون مسئول';

                    return (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-slate-500">
                          مسئول پیگیری (اپراتور)
                        </FormLabel>
                        <div className="flex items-center gap-2">
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setIsAdminChanged(true);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-2xs">
                                <SelectValue placeholder="انتخاب مسئول">
                                  {selectedKam
                                    ? `${selectedKam.firstname} ${selectedKam.lastname}`
                                    : adminFullName}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {kams.map((kam: User) => (
                                <SelectItem key={kam.id} value={kam.id}>
                                  {`${kam.firstname} ${kam.lastname}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isAdminChanged && (
                            <Button
                              type="button"
                              className="h-9 w-9 shrink-0 rounded-xl p-0"
                              onClick={handleUpdateAdmin}
                            >
                              <CheckIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </FormItem>
                    );
                  }}
                />
              )}
            </form>
          </Form>
        </div>

        {/* Edit Lead Button */}
        <Button
          type="button"
          size="sm"
          className="w-full rounded-xl"
          onClick={() => setDialogLeadFormOpen(true)}
        >
          <PencilSimpleLineIcon className="ml-1 h-4 w-4" />
          ویرایش اطلاعات سرنخ
        </Button>

        {/* Note Textarea */}
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-700">یادداشت سرنخ:</h3>
            {isMarketingLeadNoteChanged && (
              <Button
                type="button"
                className="h-7 w-7 shrink-0 rounded-lg p-0"
                onClick={handleUpdateNote}
              >
                <CheckIcon className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <Textarea
            className="shadow-3xs min-h-[90px] w-full resize-none rounded-xl border-yellow-200 bg-yellow-50/50 text-xs leading-relaxed focus-visible:ring-yellow-300"
            placeholder="یادداشتی در مورد این سرنخ بنویسید..."
            value={marketingLeadNote}
            onChange={(e) => {
              setMarketingLeadNote(e.target.value);
              setIsMarketingLeadNoteChanged(true);
            }}
          />
        </div>
      </div>

      {/* Right Column: Activity Panel */}
      <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        {/* Panel Header */}
        <div className="shrink-0 border-b border-slate-100 bg-slate-50/40 p-4">
          <div className="space-y-0.5">
            <h1 className="text-base font-bold text-slate-800">تاریخچه و جزئیات فعالیت‌ها</h1>
            <p className="text-xs text-slate-400">ثبت و پیگیری عملیات‌های فروش</p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-slate-50/20">
          {/* Messages Area */}
          <div className="scrollbar-thin scrollbar-thumb-slate-200 flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto p-5">
            {actions?.items?.length > 0 ? (
              <div className="flex flex-col space-y-4">
                {[...actions.items]
                  .sort(
                    (a, b) => new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime(),
                  )
                  .map((action: Action) => {
                    const formattedDate = dayjs
                      .tz(action.actionDate, 'Asia/Tehran')
                      .calendar('jalali')
                      .format('YYYY/MM/DD HH:mm');

                    const typeLabels: Record<string, string> = {
                      phone: 'تلفن',
                      whatsapp: 'واتسپ',
                      telegram: 'تلگرام',
                      instagram: 'اینستاگرم',
                    };

                    const typeIcons: Record<string, React.ReactNode> = {
                      phone: <PhoneCallIcon className="h-3.5 w-3.5 shrink-0 text-sky-500" />,
                      whatsapp: <WhatsappLogoIcon size={14} className="shrink-0 text-green-500" />,
                      telegram: <TelegramLogoIcon size={14} className="shrink-0 text-blue-500" />,
                      instagram: <InstagramLogoIcon size={14} className="shrink-0 text-pink-500" />,
                    };

                    const isDone = action.status === 'done';

                    return (
                      <div
                        key={action.id}
                        className={cn(
                          'shadow-3xs flex max-w-[80%] flex-col rounded-2xl border p-3 transition-all duration-200 md:max-w-[70%]',
                          isDone
                            ? 'mr-auto rounded-tl-none border-slate-200 bg-slate-100/90 text-slate-500'
                            : 'ml-auto rounded-tr-none border-blue-100 bg-blue-50/90 text-blue-900',
                        )}
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-6 text-[10px] font-bold opacity-75">
                          <span className="flex items-center gap-1">
                            {typeIcons[action.type]}
                            <span>{typeLabels[action.type] ?? 'نامشخص'}</span>
                          </span>
                          <span>{`${action.admin.firstname} ${action.admin.lastname}`}</span>
                        </div>

                        <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap md:text-sm">
                          {action.description}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between gap-4 border-t border-current/10 pt-1.5 text-[10px] opacity-60">
                          <span>{formattedDate}</span>
                          <div className="flex items-center gap-2">
                            <label className="flex cursor-pointer items-center gap-1 font-semibold select-none">
                              <Checkbox
                                className="h-3.5 w-3.5 cursor-pointer rounded-sm border-current/30 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                                checked={isDone}
                                onCheckedChange={async (checked) => {
                                  const newStatus = checked ? 'done' : 'todo';
                                  try {
                                    await api.post(`/actions/status/${action.id}`, {
                                      status: newStatus,
                                    });
                                    await mutateActions();
                                    toast.success('وضعیت عملیات به‌روز شد.');
                                  } catch {
                                    toast.error('خطا در به‌روزرسانی وضعیت.');
                                  }
                                }}
                              />
                              <span>انجام شد</span>
                            </label>
                            {user?.role !== 'kam' && (
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-5 w-5 rounded-md p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-800"
                                onClick={() => {
                                  setSelectedActionId(action.id);
                                  setDialogDeleteOpen(true);
                                }}
                              >
                                <TrashIcon size={14} />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-10 text-slate-400">
                <CrosshairSimpleIcon size={48} className="mb-2 opacity-50" />
                <p className="text-xs font-semibold">در حال حاضر هیچ عملیاتی وجود ندارد.</p>
                <p className="mt-1 max-w-sm text-center text-[10px] text-slate-400/80">
                  پس از ثبت اولین عملیات وضعیت این سرنخ بطور خودکار به (پیگیری) تغییر خواهد کرد.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Input Bar */}
          <div className="shrink-0 space-y-3 border-t bg-white p-3.5 shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-auto">
                <DatePicker date={selectedDate} onChange={setSelectedDate} />
              </div>
              <div className="w-36">
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger className="shadow-3xs h-9 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-xs">
                    <SelectValue placeholder="نوع عملیات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">اینستاگرم</SelectItem>
                    <SelectItem value="telegram">تلگرام</SelectItem>
                    <SelectItem value="whatsapp">واتسپ</SelectItem>
                    <SelectItem value="phone">تلفن</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-[260px] flex-1 gap-2.5">
                <Textarea
                  className="shadow-3xs max-h-16 min-h-9 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-1.5 text-xs leading-relaxed focus-visible:ring-blue-500"
                  placeholder="شرح پیگیری را اینجا بنویسید..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button
                  type="button"
                  className="h-9 shrink-0 cursor-pointer rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                  disabled={isSavingAction}
                  onClick={handleAddAction}
                >
                  {isSavingAction ? 'ارسال...' : 'ثبت پیگیری'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {selectedActionId && (
        <DialogDelete
          open={dialogDeleteOpen}
          onOpenChange={(open) => {
            setDialogDeleteOpen(open);
            if (!open) setSelectedActionId(null);
          }}
          onConfirm={() => handleDeleteAction(selectedActionId)}
        />
      )}

      <SendSMSDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        smsData={smsData}
        recipientType="marketingLead"
      />

      <DialogFormLead
        open={dialogLeadFormOpen}
        onOpenChange={setDialogLeadFormOpen}
        data={marketingLead}
        mutate={mutateLead}
      />
    </div>
  );
}
