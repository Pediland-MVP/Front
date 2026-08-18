// src/app/users/[id]/page.tsx
'use client';

import api, { fetcher } from '@/hooks/swr/api-client';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { useKams } from '@/hooks/use-kams';
import dayjs from '@/lib/dayjs-jalali';

import { formatNumber } from '@/lib/formatNumber';
import { cn } from '@/lib/utils';
import { TaskManagementPanel } from '@/components/tasks/task-management-panel';
import { Customer } from '@/types/customer';
import { User } from '@/types/user';
import { zodResolver } from '@hookform/resolvers/zod';
import { use, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import useSWR from 'swr';
import z from 'zod';
import { useRouter } from 'next/navigation';

// UI Imports
import { FetchError } from '@/components/fetch-error';
import { Loading } from '@/components/loading';
import { SendSMSDialog } from '@/components/table/dialog-sms';
import { StatusBadge } from '@/components/table/status-badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormItem, FormLabel } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form';
import { ChatCenteredTextIcon } from '@phosphor-icons/react/dist/ssr/ChatCenteredText';
import { CrosshairSimpleIcon } from '@phosphor-icons/react/dist/ssr/CrosshairSimple';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import { TelegramLogoIcon } from '@phosphor-icons/react/dist/ssr/TelegramLogo';
import { WhatsappLogoIcon } from '@phosphor-icons/react/dist/ssr/WhatsappLogo';
import {
  CheckIcon,
  MessageSquare,
  Layers,
  Receipt,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Coins,
  Wallet,
  InfoIcon,
  PhoneCallIcon,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import DialogDelete from '@/components/dialog-delete';
import { AddSubscriptionDialog } from '@/components/customer/AddSubscriptionDialog';
import { UnflagAction } from '@/components/table/unflag-action';

const FormSchema = z.object({
  status: z.string().min(1, { message: 'وضعیت را انتخاب کنید.' }),
  admin: z.string().min(1),
});

export default function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [isStatusChanged, setIsStatusChanged] = useState(false);
  const [isAdminChanged, setIsAdminChanged] = useState(false);
  const [customerNote, setCustomerNote] = useState<string>('');
  const [isCustomerNoteChanged, setIsCustomerNoteChanged] = useState(false);
  const [isFlaged, setIsFlaged] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [smsData, setSmsData] = useState<{
    id: string;
    mobile: string;
    name: string;
  } | null>(null);

  // Tabs and pagination states
  const [activeTab, setActiveTab] = useState<'timeline' | 'workspaces' | 'subscriptions'>(
    'timeline',
  );
  const [workspacesPage, setWorkspacesPage] = useState(1);
  const [subsPage, setSubsPage] = useState(1);

  const { user } = useAuth();
  const t = useTranslations('Users');
  const { id } = use(params);
  const router = useRouter();

  // Primary User data
  const {
    data: customer,
    isLoading,
    error,
    mutate: mutateCustomer,
  } = useSWR<Customer>(`/users/${id}`, fetcher);

  const {
    kams,
    isLoading: isKamsLoading,
    isError: kamsError,
  } = useKams({
    roles: 'manager,kam',
    enabled: user?.role !== 'kam',
  });

  // Paginated Workspaces
  const {
    data: workspacesData,
    isLoading: isWorkspacesLoading,
    mutate: mutateWorkspaces,
  } = useSWR(`/users/${id}/workspaces?page=${workspacesPage}&limit=5`, fetcher);

  // Paginated Subscriptions
  const {
    data: subsData,
    isLoading: isSubsLoading,
    mutate: mutateSubs,
  } = useSWR(`/users/${id}/subscriptions?page=${subsPage}&limit=5`, fetcher);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      status: '',
      admin: '',
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        status: customer?.status,
        admin: customer?.usersAdmins.find((admin) => admin.isActive)?.admin.id,
      });
    }
  }, [customer, form]);

  const handleUpdateStatus = async () => {
    try {
      const status = form.getValues('status');

      await api.post(`/users/status/${id}`, {
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

      await api.post('/users/assignAdmin', {
        adminId,
        userIds: [id],
      });

      setIsAdminChanged(false);
      toast.success('مسئول با موفقیت تغییر کرد');
    } catch (error) {
      console.error(error);
      toast.error('خطا در تغییر مسئول');
    }
  };

  useEffect(() => {
    if (customer?.note) {
      setCustomerNote(customer.note);
    }
  }, [customer]);

  const handleUpdateNote = async () => {
    try {
      await api.post(`/users/${id}/note`, {
        note: typeof customerNote === 'string' ? customerNote.trim() : '1',
      });

      setIsCustomerNoteChanged(false);
      toast.success('یادداشت با موفقیت به‌روز شد.');
    } catch (error) {
      console.error('خطا در آپدیت یادداشت:', error);
      toast.error('خطا در ذخیره‌سازی');
    }
  };

  const handDeleteFlag = async () => {
    try {
      await api.delete(`/users/${id}/deleteFlag`);
      setIsDeleteUserDialogOpen(false);
      router.push('/users');
      toast.success('کاربر با موفقیت حذف شد.');
    } catch (error) {
      console.error(error);
      toast.error('خطا در حذف کاربر.');
    }
  };

  const handleOpenSmsDialog = () => {
    if (!customer?.mobile) return;

    setSmsData({
      id,
      mobile: customer.mobile,
      name: `${customer?.firstname} ${customer?.lastname}`,
    });
    setSmsDialogOpen(true);
  };

  const hasInstagram = (customer?.instagrams.length ?? 0) > 0;

  const referralUser =
    customer?.referralUser?.referralCode?.user?.firstname ||
    customer?.referralUser?.referralCode?.user?.lastname
      ? `${customer?.referralUser?.referralCode?.user?.firstname} ${customer?.referralUser?.referralCode?.user?.lastname}`
      : 'ندارد';

  if (isLoading || isKamsLoading) return <Loading />;
  if (error || kamsError) return <FetchError />;
  if (!form.getValues('status')) return <p>خطایی رخ داده است.</p>;

  const workspaces = workspacesData?.items || [];
  const workspacesMeta = workspacesData?.meta;

  const subs = subsData?.items || [];
  const subsMeta = subsData?.meta;

  return (
    <div
      className="flex flex-col gap-6 bg-slate-50/20 p-0 lg:h-[calc(100vh-40px)] lg:flex-row lg:overflow-hidden lg:p-4"
      dir="rtl"
    >
      {/* Right Column: Profile Sidebar */}
      <div className="scrollbar-thin scrollbar-thumb-slate-200 flex w-full shrink-0 flex-col gap-5 rounded-2xl border border-slate-100 bg-white p-5 pr-1 shadow-xs lg:w-96 lg:overflow-y-auto">
        {/* Profile Card Header */}
        <div className="flex flex-col items-center space-y-3 border-b border-slate-100 pb-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-tr from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-md">
            {customer ? `${customer.firstname?.[0] || ''}${customer.lastname?.[0] || ''}` : 'م'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {customer?.firstname} {customer?.lastname}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400" dir="ltr">
              {customer?.mobile || customer?.email || '—'}
            </p>
          </div>

          {/* Quick Action Circle Buttons */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {customer?.mobile && (
              <a
                href={`tel:${customer.mobile}`}
                className="shadow-3xs flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-slate-50 text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-800"
                title="تماس تلفنی"
              >
                <PhoneCallIcon className="h-4 w-4" />
              </a>
            )}
            {customer?.mobile && (
              <button
                onClick={handleOpenSmsDialog}
                className="shadow-3xs flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600 transition-all duration-150 hover:bg-blue-100"
                title="ارسال پیامک"
              >
                <ChatCenteredTextIcon size={18} />
              </button>
            )}
            {customer?.mobile && (
              <a
                href={`https://t.me/+98${customer.mobile.replace(/^0/, '')}`}
                className="shadow-3xs flex h-9 w-9 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sky-600 transition-all duration-150 hover:bg-sky-100"
                target="_blank"
                rel="noopener noreferrer"
                title="تلگرام"
              >
                <TelegramLogoIcon size={18} />
              </a>
            )}
            {customer?.mobile && (
              <a
                href={`https://wa.me/98${customer.mobile.replace(/^0/, '')}`}
                className="shadow-3xs flex h-9 w-9 items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-600 transition-all duration-150 hover:bg-green-100"
                target="_blank"
                rel="noopener noreferrer"
                title="واتسپ"
              >
                <WhatsappLogoIcon size={18} />
              </a>
            )}
            {customer?.email && (
              <a
                href={`mailto:${customer.email}`}
                className="shadow-3xs flex h-9 w-9 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-amber-600 transition-all duration-150 hover:bg-amber-100"
                title={customer.email}
              >
                <EnvelopeSimpleIcon size={18} />
              </a>
            )}
          </div>

          {/* Status + operator pinned to opposite corners */}
          <Form {...form}>
            <form className="w-full">
              <div className="flex w-full items-center justify-between gap-2 pt-1">
                {/* Status — right corner */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <div className="flex items-center gap-1.5">
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setIsStatusChanged(true);
                        }}
                        value={field.value}
                        disabled={customer?.status === 'unset' || customer?.status === 'new'}
                      >
                        <FormControl>
                          <SelectTrigger className="!h-auto cursor-pointer border-0 p-0 shadow-none focus:ring-0 focus-visible:ring-0 [&>svg]:hidden">
                            <StatusBadge status={field.value} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="needed">
                            <StatusBadge status="needed" />
                          </SelectItem>
                          <SelectItem value="inactive">
                            <StatusBadge status="inactive" />
                          </SelectItem>
                          <SelectItem value="active">
                            <StatusBadge status="active" />
                          </SelectItem>
                          <SelectItem value="lost">
                            <StatusBadge status="lost" />
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {isStatusChanged && (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-6 w-6 shrink-0 rounded-md border-emerald-200 p-0 text-emerald-600 hover:bg-emerald-50"
                          onClick={handleUpdateStatus}
                        >
                          <CheckIcon className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                />

                {/* Operator — left corner */}
                {user?.role !== 'kam' && (
                  <FormField
                    control={form.control}
                    name="admin"
                    render={({ field }) => {
                      const selectedKam = kams.find((kam: User) => kam.id === field.value);
                      const adminKam = customer?.usersAdmins.find((a) => a.isActive);
                      const adminFullName = adminKam
                        ? `${adminKam.admin.firstname} ${adminKam.admin.lastname}`
                        : 'بدون مسئول';

                      return (
                        <div className="flex items-center gap-1.5">
                          {isAdminChanged && (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-6 w-6 shrink-0 rounded-md border-emerald-200 p-0 text-emerald-600 hover:bg-emerald-50"
                              onClick={handleUpdateAdmin}
                            >
                              <CheckIcon className="h-3 w-3" />
                            </Button>
                          )}
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setIsAdminChanged(true);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="!h-auto cursor-pointer border-0 p-0 shadow-none focus:ring-0 focus-visible:ring-0 [&>svg]:hidden">
                                <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                                  <CrosshairSimpleIcon className="h-3 w-3 shrink-0" />
                                  <span className="max-w-[90px] truncate text-[11px] font-medium">
                                    {selectedKam
                                      ? `${selectedKam.firstname} ${selectedKam.lastname}`
                                      : adminFullName}
                                  </span>
                                </div>
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
                        </div>
                      );
                    }}
                  />
                )}
              </div>
            </form>
          </Form>
        </div>

        {/* Acquisition channel — read-only. Collected once by the dashboard's
            business-info dialog on automation create, and absent from /settings/profile,
            so it stays null for users who have not created an automation since it shipped. */}
        <div className="space-y-3 rounded-2xl border border-slate-100/50 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{t('howFoundUs_label')}</span>
            <span className="text-right font-semibold text-slate-800">
              {customer?.howFoundUs ? t(`options.${customer.howFoundUs}`) : t('howFoundUs_none')}
            </span>
          </div>
        </div>

        {/* Subscription Plan Card */}
        <div className="space-y-3 rounded-2xl border border-slate-100/50 bg-slate-50/80 p-4">
          <h3 className="flex items-center gap-1.5 border-b pb-2 text-xs font-semibold text-slate-700">
            <Wallet className="h-4 w-4 text-indigo-500" />
            <span>بسته‌های اشتراک</span>
          </h3>

          <div className="space-y-2 text-xs">
            {(() => {
              const activeSubs =
                customer?.subscriptions?.filter((s) => s.status === 'active') ?? [];
              if (activeSubs.length === 0) {
                return (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">بسته فعال:</span>
                    <span className="text-right font-semibold text-slate-800">ندارد</span>
                  </div>
                );
              }
              return activeSubs.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between">
                  <span className="text-slate-500">بسته فعال:</span>
                  <span className="text-right font-semibold text-slate-800">
                    {`${sub.planDuration?.name}، ${formatNumber(sub.planDuration?.price)} ریال`}
                    {` (${sub.isPersonalWorkspace ? 'شخصی' : sub.workspaceName})`}
                  </span>
                </div>
              ));
            })()}

            {customer?.subscriptions?.find((s) => ['active', 'reserved'].includes(s.status)) && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">باقی مانده:</span>
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-600">
                  {(() => {
                    const now = Date.now();
                    // Reserved subs always have `expire = null` (queued, not ticking yet) —
                    // don't require `expire` here or every reserved sub gets dropped before the
                    // reduce below ever gets to use its `planDuration.durationDays` branch.
                    const validSubs = customer?.subscriptions?.filter((s) =>
                      ['active', 'reserved'].includes(s.status),
                    );
                    if (validSubs.length === 0) return '0 روز';
                    const totalDays = validSubs.reduce((sum, s) => {
                      if (s.status === 'reserved') {
                        return sum + (s.planDuration.durationDays || 0);
                      }
                      if (s.status === 'active') {
                        const expire = new Date(s.expire).getTime();
                        const remainingMs = expire - now;
                        const remainingDays =
                          remainingMs > 0 ? Math.ceil(remainingMs / (1000 * 60 * 60 * 24)) : 0;
                        return sum + remainingDays;
                      }
                      return sum;
                    }, 0);
                    return `${totalDays} روز`;
                  })()}
                </span>
              </div>
            )}

            {(() => {
              const reservedSubs =
                customer?.subscriptions?.filter((s) => s.status === 'reserved') ?? [];
              if (reservedSubs.length === 0) {
                return (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">بسته رزرو:</span>
                    <span className="text-right font-semibold text-slate-800">ندارد</span>
                  </div>
                );
              }
              return reservedSubs.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between">
                  <span className="text-slate-500">بسته رزرو:</span>
                  <span className="text-right font-semibold text-slate-800">
                    {`${Math.floor(sub.planDuration.durationDays / 30)} ماهه، ${formatNumber(sub.invoices[0]?.amount)} ریال`}
                    {` (${sub.isPersonalWorkspace ? 'شخصی' : sub.workspaceName})`}
                  </span>
                </div>
              ));
            })()}
          </div>

          {user?.role !== 'kam' && (
            <Button
              size="sm"
              type="button"
              className="h-auto w-full cursor-pointer rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:from-indigo-700 hover:to-violet-700"
              onClick={() => setSubscriptionDialogOpen(true)}
            >
              شارژ دستی حساب مشتری
            </Button>
          )}
        </div>

        {/* Social Accounts links */}
        {hasInstagram && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400">حساب‌های اینستاگرام:</h4>
            <div className="space-y-1.5">
              {customer?.instagrams.map((ig) => (
                <div
                  key={ig.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2"
                >
                  <a
                    className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-600 transition-colors hover:text-indigo-600"
                    href={`https://instagram.com/${ig.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                  >
                    <InstagramLogoIcon size={18} className="shrink-0 text-pink-600" />
                    <span className="truncate">@{ig.username}</span>
                  </a>
                  <IgTokenBadge isValid={ig.isIgTokenValid} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Stats Card */}
        <div className="space-y-3 rounded-2xl border border-slate-100/50 bg-slate-50/80 p-4">
          <h3 className="flex items-center gap-1.5 border-b pb-2 text-xs font-semibold text-slate-700">
            <Coins className="h-4 w-4 text-blue-500" />
            <span>آمارهای فعالیت و فروش</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {hasInstagram && (
              <>
                <div className="shadow-3xs space-y-0.5 rounded-xl border border-slate-100 bg-white p-2.5">
                  <span className="block text-[10px] text-slate-400">فالوور</span>
                  <span className="block text-sm font-bold text-slate-800">
                    {formatNumber(customer?.instagrams[0]?.followersCount)}
                  </span>
                </div>
                <div className="shadow-3xs space-y-0.5 rounded-xl border border-slate-100 bg-white p-2.5">
                  <span className="block text-[10px] text-slate-400">تعداد پست</span>
                  <span className="block text-sm font-bold text-slate-800">
                    {formatNumber(customer?.instagrams[0]?.mediaCount)}
                  </span>
                </div>
              </>
            )}
            <div className="shadow-3xs space-y-0.5 rounded-xl border border-slate-100 bg-white p-2.5">
              <span className="block text-[10px] text-slate-400">مخاطبین</span>
              <span className="block text-sm font-bold text-slate-800">
                {formatNumber(customer?.stats.leadCount)}
              </span>
            </div>
            <div className="shadow-3xs space-y-0.5 rounded-xl border border-slate-100 bg-white p-2.5">
              <span className="block text-[10px] text-slate-400">پاسخ‌ها</span>
              <span className="block text-sm font-bold text-slate-800">
                {formatNumber(customer?.stats.sessionCount)}
              </span>
            </div>
            <div className="shadow-3xs space-y-0.5 rounded-xl border border-slate-100 bg-white p-2.5">
              <span className="block text-[10px] text-slate-400">محصولات</span>
              <span className="block text-sm font-bold text-slate-800">
                {formatNumber(customer?.stats.productCount)}
              </span>
            </div>
            <div className="shadow-3xs space-y-0.5 rounded-xl border border-slate-100 bg-white p-2.5">
              <span className="block text-[10px] text-slate-400">تعداد فروش</span>
              <span className="block text-sm font-bold text-slate-800">
                {formatNumber(customer?.stats.salesCount)}
              </span>
            </div>
            <div className="shadow-3xs col-span-2 flex items-center justify-between space-y-0.5 rounded-xl border border-slate-100 bg-white bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-2.5 px-3 py-2">
              <span className="text-xs font-semibold text-slate-600">جمع کل فروش:</span>
              <span className="text-sm font-bold text-indigo-700">
                {formatNumber(customer?.stats.totalSale)} ریال
              </span>
            </div>
          </div>
        </div>

        {/* Registration and Referrals */}
        <div className="space-y-2.5 rounded-2xl border border-slate-100/50 bg-slate-50/80 p-4 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span>تاریخ ثبت نام:</span>
            <span className="font-semibold text-slate-800">
              {dayjs(customer?.createDate).calendar('jalali').format('YYYY/MM/DD')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>نام کاربری اعلامی:</span>
            {customer?.submittedInstagramUsername ? (
              <a
                href={`https://instagram.com/${customer.submittedInstagramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
                dir="ltr"
              >
                @{customer.submittedInstagramUsername}
              </a>
            ) : (
              <span className="font-semibold text-slate-800">ندارد</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>فالوور اعلامی:</span>
            <span className="font-semibold text-slate-800">
              {customer?.submittedInstagramFollowersCount != null
                ? formatNumber(customer.submittedInstagramFollowersCount)
                : 'ندارد'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>معرف:</span>
            <span className="font-semibold text-slate-800">{referralUser}</span>
          </div>
          {customer?.referralUser?.referralCode?.code && (
            <div className="flex items-center justify-between">
              <span>کد معرف:</span>
              <span className="font-semibold text-indigo-600 uppercase">
                {customer?.referralUser?.referralCode?.code}
              </span>
            </div>
          )}
        </div>

        {/* Delete flag / restore */}
        {customer?.isDeleteFlaged
          ? user?.role === 'admin' && (
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-emerald-700">
                    این کاربر برای حذف علامت‌گذاری شده است
                  </span>
                  <span className="text-[11px] text-emerald-600/80">
                    برای نمایش مجدد در لیست اصلی، کاربر را بازگردانی کنید.
                  </span>
                </div>
                <UnflagAction
                  userId={id}
                  userName={`${customer?.firstname ?? ''} ${customer?.lastname ?? ''}`.trim()}
                  onUnflagged={() => mutateCustomer()}
                />
              </div>
            )
          : user?.role !== 'kam' && (
              <div className="flex items-center justify-between rounded-xl border border-rose-100/50 bg-rose-50/50 p-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="deleteFlag"
                    className="cursor-pointer border-rose-300 data-[state=checked]:border-rose-500 data-[state=checked]:bg-rose-500"
                    checked={isFlaged}
                    onCheckedChange={(value) => setIsFlaged(!!value)}
                  />
                  <Label
                    htmlFor="deleteFlag"
                    className="cursor-pointer text-xs font-semibold text-rose-700"
                  >
                    علامت‌گذاری برای حذف
                  </Label>
                </div>
                {isFlaged && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-7 shrink-0 rounded-lg bg-rose-600 px-3 text-[10px] font-semibold hover:bg-rose-700"
                    onClick={() => setIsDeleteUserDialogOpen(true)}
                  >
                    تایید حذف
                  </Button>
                )}
              </div>
            )}

        {/* Customer Note Box */}
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <InfoIcon className="h-4 w-4 text-amber-500" />
              <span>یادداشت مشتری:</span>
            </h3>
            {isCustomerNoteChanged && (
              <Button
                type="button"
                variant="outline"
                className="h-7 w-7 shrink-0 rounded-lg border-emerald-200 p-0 text-emerald-600 hover:bg-emerald-50"
                onClick={handleUpdateNote}
              >
                <CheckIcon className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <Textarea
            className="shadow-3xs min-h-[90px] w-full resize-none rounded-xl border-yellow-200 bg-yellow-50/50 text-xs leading-relaxed focus-visible:ring-yellow-300"
            placeholder="یادداشتی در مورد این کاربر بنویسید..."
            value={customerNote}
            onChange={(e) => {
              setCustomerNote(e.target.value);
              setIsCustomerNoteChanged(true);
            }}
          />
        </div>
      </div>

      {/* Left Column: Interactive Chat-style Panel & Tabs */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs lg:h-full lg:flex-1">
        {/* Panel Header & Tab Switcher */}
        <div className="flex shrink-0 flex-col items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/40 p-4 sm:flex-row sm:items-center">
          <div className="space-y-0.5">
            <h1 className="text-base font-bold text-slate-800">تاریخچه و جزئیات فعالیت‌ها</h1>
            <p className="text-xs text-slate-400">
              فضاهای کاری، بسته‌های اشتراک و گفتگوی پیگیری اپراتورها
            </p>
          </div>

          {/* Telegram-style Tab Pills */}
          <div className="flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto">
            <button
              onClick={() => setActiveTab('timeline')}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-150 select-none sm:flex-initial',
                activeTab === 'timeline'
                  ? 'shadow-3xs bg-white text-blue-600'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              <MessageSquare className="h-4 w-4" />
              <span>پیگیری‌ها (گفتگو)</span>
            </button>
            <button
              onClick={() => setActiveTab('workspaces')}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-150 select-none sm:flex-initial',
                activeTab === 'workspaces'
                  ? 'shadow-3xs bg-white text-blue-600'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              <Layers className="h-4 w-4" />
              <span>فضاهای کاری</span>
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-150 select-none sm:flex-initial',
                activeTab === 'subscriptions'
                  ? 'shadow-3xs bg-white text-blue-600'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              <Receipt className="h-4 w-4" />
              <span>اشتراک‌ها</span>
            </button>
          </div>
        </div>

        {/* Panel Content Body */}
        <div className="flex flex-col bg-slate-50/20 lg:min-h-0 lg:flex-1">
          {activeTab === 'timeline' && (
            <div className="flex flex-col lg:h-full lg:flex-1 lg:overflow-hidden">
              <TaskManagementPanel
                userId={id}
                currentUserRole={user.role}
                onChanged={() => {
                  mutateCustomer();
                }}
              />
            </div>
          )}

          {activeTab === 'workspaces' && (
            <div className="scrollbar-thin scrollbar-thumb-slate-200 min-h-[360px] space-y-4 overflow-y-auto p-5 lg:flex-1">
              {isWorkspacesLoading ? (
                <div className="flex justify-center py-10">
                  <Loading />
                </div>
              ) : workspaces.length > 0 ? (
                <div className="space-y-3.5">
                  {workspaces.map((ws: any) => (
                    <WorkspaceCard key={ws.workspaceId} workspace={ws} />
                  ))}

                  {/* Workspaces Pagination Controls */}
                  {workspacesMeta && workspacesMeta.totalPages > 1 && (
                    <div className="shadow-3xs mt-5 flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 cursor-pointer rounded-lg text-xs font-semibold"
                        disabled={workspacesPage <= 1}
                        onClick={() => setWorkspacesPage((prev) => Math.max(prev - 1, 1))}
                      >
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        <span>قبلی</span>
                      </Button>
                      <span className="text-xs font-bold text-slate-500">
                        صفحه {workspacesPage} از {workspacesMeta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 cursor-pointer rounded-lg text-xs font-semibold"
                        disabled={workspacesPage >= workspacesMeta.totalPages}
                        onClick={() =>
                          setWorkspacesPage((prev) => Math.min(prev + 1, workspacesMeta.totalPages))
                        }
                      >
                        <span>بعدی</span>
                        <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Layers className="mb-2 h-12 w-12 stroke-[1.2] opacity-50" />
                  <p className="text-xs font-semibold">کاربر در هیچ فضای کاری عضو نیست.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="scrollbar-thin scrollbar-thumb-slate-200 min-h-[360px] space-y-4 overflow-y-auto p-5 lg:flex-1">
              {isSubsLoading ? (
                <div className="flex justify-center py-10">
                  <Loading />
                </div>
              ) : subs.length > 0 ? (
                <div className="space-y-4">
                  {subs.map((sub: any) => (
                    <SubscriptionCard key={sub.id} subscription={sub} />
                  ))}

                  {/* Subscriptions Pagination Controls */}
                  {subsMeta && subsMeta.totalPages > 1 && (
                    <div className="shadow-3xs mt-5 flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 cursor-pointer rounded-lg text-xs font-semibold"
                        disabled={subsPage <= 1}
                        onClick={() => setSubsPage((prev) => Math.max(prev - 1, 1))}
                      >
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        <span>قبلی</span>
                      </Button>
                      <span className="text-xs font-bold text-slate-500">
                        صفحه {subsPage} از {subsMeta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 cursor-pointer rounded-lg text-xs font-semibold"
                        disabled={subsPage >= subsMeta.totalPages}
                        onClick={() =>
                          setSubsPage((prev) => Math.min(prev + 1, subsMeta.totalPages))
                        }
                      >
                        <span>بعدی</span>
                        <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Receipt className="mb-2 h-12 w-12 stroke-[1.2] opacity-50" />
                  <p className="text-xs font-semibold">هیچ اشتراکی برای این کاربر ثبت نشده است.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs & Overlays */}
      <DialogDelete
        open={isDeleteUserDialogOpen}
        onOpenChange={setIsDeleteUserDialogOpen}
        onConfirm={handDeleteFlag}
      />

      <SendSMSDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        smsData={smsData}
        recipientType="user"
      />

      <AddSubscriptionDialog
        open={subscriptionDialogOpen}
        onOpenChange={setSubscriptionDialogOpen}
        userId={customer?.id || ''}
      />
    </div>
  );
}

/* Internal Components for Workspaces and Subscriptions list items */

function IgTokenBadge({ isValid }: { isValid?: boolean }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold',
        isValid
          ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
          : 'border-rose-100 bg-rose-50 text-rose-700',
      )}
    >
      {isValid ? 'متصل' : 'قطع'}
    </span>
  );
}

function WorkspaceCard({ workspace }: { workspace: any }) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = dayjs(workspace.joinedAt).calendar('jalali').format('YYYY/MM/DD');

  const isOwner = workspace.role === 'owner';

  // Dynamic colors for workspace letter avatars
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-emerald-500 to-teal-600',
      'from-teal-500 to-cyan-600',
      'from-cyan-500 to-sky-600',
      'from-sky-500 to-blue-600',
      'from-blue-500 to-indigo-600',
      'from-indigo-500 to-violet-600',
      'from-violet-500 to-purple-600',
      'from-purple-500 to-pink-600',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xs transition-shadow duration-150 hover:shadow-xs">
      <div
        className="flex cursor-pointer items-center justify-between p-3.5 transition-colors hover:bg-slate-50/40"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {/* Avatar Icon */}
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr text-sm font-bold text-white shadow-xs',
              getAvatarColor(workspace.workspaceName),
            )}
          >
            {workspace.workspaceName.slice(0, 2)}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">{workspace.workspaceName}</span>
              {workspace.isPersonal && (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                  شخصی
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <span>تاریخ عضویت: {formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Badge */}
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
              isOwner
                ? 'border-purple-100 bg-purple-50 text-purple-700'
                : 'border-blue-100 bg-blue-50 text-blue-700',
            )}
          >
            {isOwner ? 'مالک' : 'عضو'}
          </span>

          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-slate-50 bg-slate-50/20 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            <span>دسترسی‌ها و مجوزها:</span>
          </div>

          {isOwner ? (
            <p className="flex items-center gap-2 rounded-xl border border-emerald-100/60 bg-emerald-50/50 px-3 py-2 text-xs font-semibold text-emerald-600">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
              این کاربر مالک فضای کاری است و دسترسی کامل به تمامی بخش‌ها دارد.
            </p>
          ) : workspace.permissions?.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {workspace.permissions.map((p: any) => (
                <div
                  key={p.slug}
                  className="shadow-3xs flex items-start gap-2 rounded-xl border border-slate-100 bg-white p-2"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-slate-700" dir="ltr">
                      {p.slug}
                    </span>
                    <span className="block text-[10px] leading-tight font-medium text-slate-400">
                      {p.description || 'بدون توضیحات'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-amber-100/60 bg-amber-50/50 px-3 py-2 text-xs text-amber-600">
              هیچ دسترسی خاصی برای این عضو تعریف نشده است.
            </p>
          )}

          {workspace.instagrams?.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <InstagramLogoIcon size={16} className="text-pink-600" />
                <span>اینستاگرام‌ها:</span>
              </div>
              <div className="space-y-1.5">
                {workspace.instagrams.map((ig: any) => (
                  <div
                    key={ig.id}
                    className="shadow-3xs flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white p-2"
                  >
                    <a
                      className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-600 transition-colors hover:text-indigo-600"
                      href={`https://instagram.com/${ig.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                    >
                      <InstagramLogoIcon size={16} className="shrink-0 text-pink-600" />
                      <span className="truncate">@{ig.username}</span>
                    </a>
                    <IgTokenBadge isValid={ig.isIgTokenValid} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubscriptionCard({ subscription }: { subscription: any }) {
  const [expanded, setExpanded] = useState(false);

  const createDate = dayjs(subscription.createDate).calendar('jalali').format('YYYY/MM/DD HH:mm');

  const expireDate = subscription.expire
    ? dayjs(subscription.expire).calendar('jalali').format('YYYY/MM/DD')
    : 'نامحدود';

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      active: { label: 'فعال', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
      reserved: { label: 'رزرو', className: 'bg-blue-50 text-blue-700 border-blue-100' },
      expired: { label: 'منقضی شده', className: 'bg-rose-50 text-rose-700 border-rose-100' },
      pending: { label: 'در انتظار', className: 'bg-amber-50 text-amber-700 border-amber-100' },
      canceled: { label: 'لغو شده', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    };

    const item = config[status] || { label: status, className: 'bg-slate-50 text-slate-600' };
    return (
      <span
        className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-bold', item.className)}
      >
        {item.label}
      </span>
    );
  };

  const planName = subscription.planDuration?.plan?.name || 'بسته عمومی';
  const durationName = subscription.planDuration?.name || 'سفارشی';
  const price = subscription.planDuration?.price || 0;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xs transition-shadow duration-150 hover:shadow-xs">
      <div
        className="flex cursor-pointer items-center justify-between p-3.5 transition-colors hover:bg-slate-50/40"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {/* Card Icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xs">
            <Receipt size={18} className="stroke-[1.8]" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">
                {planName} ({durationName})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] font-semibold text-slate-400">
              <span>شروع: {createDate}</span>
              <span className="hidden md:inline">•</span>
              <span>انقضا: {expireDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(subscription.status)}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-slate-50 bg-slate-50/20 p-4">
          <div className="grid grid-cols-1 gap-3.5 text-xs md:grid-cols-3">
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-400">شناسه اشتراک</span>
              <span className="block font-mono text-slate-700" dir="ltr">
                {subscription.id}
              </span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-400">فضای کاری</span>
              <span className="block font-bold text-slate-700">{subscription.workspaceName}</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-400">مبلغ بسته</span>
              <span className="block font-bold text-indigo-700 text-slate-800">
                {formatNumber(price)} ریال
              </span>
            </div>
          </div>

          {/* Invoices inside Subscription */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Receipt className="h-4 w-4 text-indigo-500" />
              <span>صورتحساب‌های پرداخت شده:</span>
            </div>

            {subscription.invoices && subscription.invoices.length > 0 ? (
              <div className="shadow-3xs overflow-hidden rounded-xl border border-slate-100 bg-white">
                <Table className="text-[11px] leading-tight">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="py-2 text-right">شناسه فاکتور</TableHead>
                      <TableHead className="py-2 text-right">مبلغ</TableHead>
                      <TableHead className="py-2 text-right">وضعیت</TableHead>
                      <TableHead className="py-2 text-right">روش پرداخت</TableHead>
                      <TableHead className="py-2 text-right">تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscription.invoices.map((inv: any) => {
                      const invDate = dayjs(inv.createDate)
                        .calendar('jalali')
                        .format('YYYY/MM/DD HH:mm');

                      const payMethodLabels: Record<string, string> = {
                        card: 'کارت به کارت',
                        zarinpal: 'زرین‌پال',
                        manual: 'ثبت دستی',
                      };

                      const invStatusLabels: Record<string, { label: string; className: string }> =
                        {
                          paid: {
                            label: 'پرداخت شده',
                            className: 'text-emerald-600 font-semibold',
                          },
                          pending: {
                            label: 'در انتظار پرداخت',
                            className: 'text-amber-600 font-semibold',
                          },
                          failed: { label: 'ناموفق', className: 'text-rose-600 font-semibold' },
                        };

                      const invStatus = invStatusLabels[inv.status] || {
                        label: inv.status,
                        className: 'text-slate-600',
                      };

                      return (
                        <TableRow key={inv.id} className="hover:bg-slate-50/30">
                          <TableCell className="py-2 font-mono">{inv.id}</TableCell>
                          <TableCell className="py-2 font-bold">
                            {formatNumber(inv.amount)} ریال
                          </TableCell>
                          <TableCell className={cn('py-2', invStatus.className)}>
                            {invStatus.label}
                          </TableCell>
                          <TableCell className="py-2">
                            {payMethodLabels[inv.paymentMethod] || inv.paymentMethod || 'نامشخص'}
                          </TableCell>
                          <TableCell className="py-2">{invDate}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="rounded-xl border border-slate-100 bg-white p-3 text-center text-[11px] text-slate-400">
                صورتحسابی ثبت نشده است.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
