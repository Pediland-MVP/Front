// src/app/customers/[id]/page.tsx
"use client";

import api, { fetcher } from "@/hooks/swr/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useKams } from "@/hooks/use-kams";
import dayjs from "@/lib/dayjs-jalali";

import { formatNumber } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import { Action } from "@/types/actions";
import { Customer } from "@/types/customer";
import { User } from "@/types/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import useSWR from "swr";
import z from "zod";
import { useRouter } from "next/navigation";

// UI Imports
import { FetchError } from "@/components/fetch-error";
import { Loading } from "@/components/loading";
import { SendSMSDialog } from "@/components/table/dialog-sms";
import { StatusBadge } from "@/components/table/status-badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Form, FormControl, FormItem, FormLabel } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form";
import {
  ChatCenteredTextIcon,
  CrosshairSimpleIcon,
  EnvelopeSimpleIcon,
  HeartIcon,
  InstagramLogoIcon,
  TelegramLogoIcon,
  TrashIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
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
  Clock,
  ArrowRight,
  ArrowLeft,
  Calendar
} from "lucide-react";
import { Label } from "@/components/ui/label";
import DialogDelete from "@/components/dialog-delete";
import { AddSubscriptionDialog } from "@/components/customer/AddSubscriptionDialog";
import { UnflagAction } from "@/components/table/unflag-action";

const FormSchema = z.object({
  status: z.string().min(1, { message: "وضعیت را انتخاب کنید." }),
  admin: z.string().min(1),
});

export default function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [dialogDeleteOpen, setDialogDeleteOpen] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [isStatusChanged, setIsStatusChanged] = useState(false);
  const [isAdminChanged, setIsAdminChanged] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>();
  const [actionType, setActionType] = useState<string>("");
  const [actionNote, setActionNote] = useState<string>("");
  const [customerNote, setCustomerNote] = useState<string>("");
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
  const [activeTab, setActiveTab] = useState<"timeline" | "workspaces" | "subscriptions">("timeline");
  const [workspacesPage, setWorkspacesPage] = useState(1);
  const [subsPage, setSubsPage] = useState(1);

  const { user } = useAuth();
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
    roles: "manager,kam",
    enabled: user?.role !== "kam",
  });

  // Action Timeline
  const {
    data: actions,
    isLoading: isActionsLoading,
    error: actionsError,
    mutate: mutateActions,
  } = useSWR(`/actions/user/${id}?limit=30&page=1`, fetcher);

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
      status: "",
      admin: "",
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
      const status = form.getValues("status");

      await api.post(`/users/status/${id}`, {
        status,
      });

      setIsStatusChanged(false);
      toast.success("وضعیت با موفقیت به‌روز شد.");
    } catch (error) {
      console.error("خطا در آپدیت وضعیت:", error);
      toast.error("خطا در ذخیره‌سازی");
    }
  };

  const handleUpdateAdmin = async () => {
    try {
      const adminId = form.getValues("admin");

      await api.post("/users/assignAdmin", {
        adminId,
        userIds: [id],
      });

      setIsAdminChanged(false);
      toast.success("مسئول با موفقیت تغییر کرد");
    } catch (error) {
      console.error(error);
      toast.error("خطا در تغییر مسئول");
    }
  };

  const handleAddAction = async () => {
    if (!selectedDate || !actionType || actionNote.trim() === "") {
      toast.error("لطفاً همه‌ی فیلدها را پر کنید.");
      return;
    }

    setIsSavingAction(true);

    const payload = {
      leadOrUserId: id,
      actionDate: selectedDate
        ? new Date(
            Date.UTC(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate(),
            ),
          ).toISOString()
        : undefined,
      for: "user",
      type: actionType,
      description: actionNote.trim(),
      status: "todo",
    };

    try {
      await api.post("/actions", payload);
      setSelectedDate(undefined);
      setActionType("");
      setActionNote("");
      await mutateActions();
      await mutateCustomer();
      toast.success("عملیات با موفقیت ثبت شد.");
    } catch (error) {
      console.error(error);
      toast.error("خطا در ثبت عملیات.");
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    try {
      await api.delete(`/actions/${actionId}`);
      setDialogDeleteOpen(false);
      await mutateActions();
      toast.success("عملیات با موفقیت حذف شد.");
    } catch (error) {
      console.error(error);
      toast.error("خطا در حذف عملیات.");
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
        note: typeof customerNote === "string" ? customerNote.trim() : "1",
      });

      setIsCustomerNoteChanged(false);
      toast.success("یادداشت با موفقیت به‌روز شد.");
    } catch (error) {
      console.error("خطا در آپدیت یادداشت:", error);
      toast.error("خطا در ذخیره‌سازی");
    }
  };

  const handDeleteFlag = async () => {
    try {
      await api.delete(`/users/${id}/deleteFlag`);
      setIsDeleteUserDialogOpen(false);
      router.push("/customers");
      toast.success("کاربر با موفقیت حذف شد.");
    } catch (error) {
      console.error(error);
      toast.error("خطا در حذف کاربر.");
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
      : "ندارد";

  if (isLoading || isKamsLoading || isActionsLoading) return <Loading />;
  if (error || kamsError || actionsError) return <FetchError />;
  if (!form.getValues("status")) return <p>خطایی رخ داده است.</p>;

  const workspaces = workspacesData?.items || [];
  const workspacesMeta = workspacesData?.meta;

  const subs = subsData?.items || [];
  const subsMeta = subsData?.meta;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-0 lg:p-4 lg:h-[calc(100vh-40px)] lg:overflow-hidden bg-slate-50/20" dir="rtl">
      {/* Right Column: Profile Sidebar */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col gap-5 lg:overflow-y-auto pr-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs scrollbar-thin scrollbar-thumb-slate-200">

        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md border-4 border-white">
            {customer ? `${customer.firstname?.[0] || ""}${customer.lastname?.[0] || ""}` : "م"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {customer?.firstname} {customer?.lastname}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5" dir="ltr">
              {customer?.mobile || customer?.email || "—"}
            </p>
          </div>

          {/* Quick Action Circle Buttons */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {customer?.mobile && (
              <a
                href={`tel:${customer.mobile}`}
                className="w-9 h-9 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center border border-slate-200/60 shadow-3xs transition-all duration-150"
                title="تماس تلفنی"
              >
                <PhoneCallIcon className="w-4 h-4" />
              </a>
            )}
            {customer?.mobile && (
              <button
                onClick={handleOpenSmsDialog}
                className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center border border-blue-100 shadow-3xs transition-all duration-150"
                title="ارسال پیامک"
              >
                <ChatCenteredTextIcon size={18} />
              </button>
            )}
            {customer?.mobile && (
              <a
                href={`https://t.me/+98${customer.mobile.replace(/^0/, "")}`}
                className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 hover:bg-sky-100 flex items-center justify-center border border-sky-100 shadow-3xs transition-all duration-150"
                target="_blank"
                rel="noopener noreferrer"
                title="تلگرام"
              >
                <TelegramLogoIcon size={18} />
              </a>
            )}
            {customer?.mobile && (
              <a
                href={`https://wa.me/98${customer.mobile.replace(/^0/, "")}`}
                className="w-9 h-9 rounded-full bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center border border-green-100 shadow-3xs transition-all duration-150"
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
                className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center border border-amber-100 shadow-3xs transition-all duration-150"
                title={customer.email}
              >
                <EnvelopeSimpleIcon size={18} />
              </a>
            )}
          </div>

          {/* Status + operator pinned to opposite corners */}
          <Form {...form}>
            <form className="w-full">
              <div className="flex items-center justify-between w-full pt-1 gap-2">

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
                        disabled={
                          customer?.status === "unset" ||
                          customer?.status === "new"
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="!h-auto border-0 p-0 shadow-none focus:ring-0 focus-visible:ring-0 [&>svg]:hidden cursor-pointer">
                            <StatusBadge status={field.value} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="needed"><StatusBadge status="needed" /></SelectItem>
                          <SelectItem value="inactive"><StatusBadge status="inactive" /></SelectItem>
                          <SelectItem value="active"><StatusBadge status="active" /></SelectItem>
                          <SelectItem value="lost"><StatusBadge status="lost" /></SelectItem>
                        </SelectContent>
                      </Select>
                      {isStatusChanged && (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-6 w-6 p-0 shrink-0 border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-md"
                          onClick={handleUpdateStatus}
                        >
                          <CheckIcon className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                />

                {/* Operator — left corner */}
                {user?.role !== "kam" && (
                  <FormField
                    control={form.control}
                    name="admin"
                    render={({ field }) => {
                      const selectedKam = kams.find((kam: User) => kam.id === field.value);
                      const adminKam = customer?.usersAdmins.find((a) => a.isActive);
                      const adminFullName = adminKam
                        ? `${adminKam.admin.firstname} ${adminKam.admin.lastname}`
                        : "بدون مسئول";

                      return (
                        <div className="flex items-center gap-1.5">
                          {isAdminChanged && (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-6 w-6 p-0 shrink-0 border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-md"
                              onClick={handleUpdateAdmin}
                            >
                              <CheckIcon className="w-3 h-3" />
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
                              <SelectTrigger className="!h-auto border-0 p-0 shadow-none focus:ring-0 focus-visible:ring-0 [&>svg]:hidden cursor-pointer">
                                <div className="flex items-center gap-1 rounded-full px-2 py-1 bg-slate-100 text-slate-600">
                                  <CrosshairSimpleIcon className="w-3 h-3 shrink-0" />
                                  <span className="text-[11px] font-medium max-w-[90px] truncate">
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

        {/* Subscription Plan Card */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50 space-y-3">
          <h3 className="font-semibold text-slate-700 text-xs flex items-center gap-1.5 border-b pb-2">
            <Wallet className="w-4 h-4 text-indigo-500" />
            <span>بسته‌های اشتراک</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">بسته فعال:</span>
              <span className="font-semibold text-slate-800 text-right">
                {(() => {
                  const activeSub = customer?.subscriptions?.find((s) => s.status === "active");
                  if (!activeSub) return "ندارد";
                  return `${activeSub?.planDuration?.name}، ${formatNumber(activeSub?.planDuration.price)} ریال`;
                })()}
              </span>
            </div>

            {customer?.subscriptions?.find((s) => s.status === "active") && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">باقی مانده:</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {(() => {
                    const now = Date.now();
                    const validSubs = customer?.subscriptions?.filter(
                      (s) => ["active", "reserved"].includes(s.status) && s.expire
                    );
                    if (validSubs.length === 0) return "0 روز";
                    const totalDays = validSubs.reduce((sum, s) => {
                      if (s.status === "reserved") {
                        return sum + (s.planDuration.durationDays || 0);
                      }
                      if (s.status === "active") {
                        const expire = new Date(s.expire).getTime();
                        const remainingMs = expire - now;
                        const remainingDays = remainingMs > 0 ? Math.ceil(remainingMs / (1000 * 60 * 60 * 24)) : 0;
                        return sum + remainingDays;
                      }
                      return sum;
                    }, 0);
                    return `${totalDays} روز`;
                  })()}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-slate-500">بسته رزرو:</span>
              <span className="font-semibold text-slate-800 text-right">
                {(() => {
                  const activeSub = customer?.subscriptions?.find((s) => s.status === "reserved");
                  if (!activeSub) return "ندارد";
                  return `${Math.floor(activeSub?.planDuration.durationDays / 30)} ماهه، ${formatNumber(activeSub?.invoices[0]?.amount)} ریال`;
                })()}
              </span>
            </div>
          </div>

          {user?.role !== "kam" && (
            <Button
              size="sm"
              type="button"
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl shadow-xs text-xs font-semibold py-2 h-auto transition-all duration-150 cursor-pointer"
              onClick={() => setSubscriptionDialogOpen(true)}
            >
              شارژ دستی حساب مشتری
            </Button>
          )}
        </div>

        {/* Social Accounts links */}
        {hasInstagram && (
          <div className="space-y-2">
            <h4 className="text-xs text-slate-400 font-semibold">حساب‌های اینستاگرام:</h4>
            <div className="space-y-1.5">
              {customer?.instagrams.map((ig) => (
                <div
                  key={ig.id}
                  className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <a
                    className="text-slate-600 hover:text-indigo-600 flex items-center gap-2 text-xs font-semibold transition-colors min-w-0"
                    href={`https://instagram.com/${ig.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                  >
                    <InstagramLogoIcon size={18} className="text-pink-600 shrink-0" />
                    <span className="truncate">@{ig.username}</span>
                  </a>
                  <IgTokenBadge isValid={ig.isIgTokenValid} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Stats Card */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50 space-y-3">
          <h3 className="font-semibold text-slate-700 text-xs flex items-center gap-1.5 border-b pb-2">
            <Coins className="w-4 h-4 text-blue-500" />
            <span>آمارهای فعالیت و فروش</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {hasInstagram && (
              <>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-3xs space-y-0.5">
                  <span className="text-slate-400 block text-[10px]">فالوور</span>
                  <span className="font-bold text-slate-800 block text-sm">{formatNumber(customer?.instagrams[0]?.followersCount)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-3xs space-y-0.5">
                  <span className="text-slate-400 block text-[10px]">تعداد پست</span>
                  <span className="font-bold text-slate-800 block text-sm">{formatNumber(customer?.instagrams[0]?.mediaCount)}</span>
                </div>
              </>
            )}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-3xs space-y-0.5">
              <span className="text-slate-400 block text-[10px]">مخاطبین</span>
              <span className="font-bold text-slate-800 block text-sm">{formatNumber(customer?.stats.leadCount)}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-3xs space-y-0.5">
              <span className="text-slate-400 block text-[10px]">پاسخ‌ها</span>
              <span className="font-bold text-slate-800 block text-sm">{formatNumber(customer?.stats.sessionCount)}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-3xs space-y-0.5">
              <span className="text-slate-400 block text-[10px]">محصولات</span>
              <span className="font-bold text-slate-800 block text-sm">{formatNumber(customer?.stats.productCount)}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-3xs space-y-0.5">
              <span className="text-slate-400 block text-[10px]">تعداد فروش</span>
              <span className="font-bold text-slate-800 block text-sm">{formatNumber(customer?.stats.salesCount)}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-3xs space-y-0.5 col-span-2 flex justify-between items-center px-3 py-2 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
              <span className="text-slate-600 text-xs font-semibold">جمع کل فروش:</span>
              <span className="font-bold text-indigo-700 text-sm">{formatNumber(customer?.stats.totalSale)} ریال</span>
            </div>
          </div>
        </div>

        {/* Registration and Referrals */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50 space-y-2.5 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span>تاریخ ثبت نام:</span>
            <span className="font-semibold text-slate-800">
              {dayjs(customer?.createDate).calendar("jalali").format("YYYY/MM/DD")}
            </span>
          </div>
          <div className="flex justify-between items-center">
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
          <div className="flex justify-between items-center">
            <span>فالوور اعلامی:</span>
            <span className="font-semibold text-slate-800">
              {customer?.submittedInstagramFollowersCount != null
                ? formatNumber(customer.submittedInstagramFollowersCount)
                : "ندارد"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>معرف:</span>
            <span className="font-semibold text-slate-800">{referralUser}</span>
          </div>
          {customer?.referralUser?.referralCode?.code && (
            <div className="flex justify-between items-center">
              <span>کد معرف:</span>
              <span className="font-semibold text-indigo-600 uppercase">
                {customer?.referralUser?.referralCode?.code}
              </span>
            </div>
          )}
        </div>

        {/* Delete flag / restore */}
        {customer?.isDeleteFlaged ? (
          user?.role === "admin" && (
            <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl">
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
                userName={`${customer?.firstname ?? ""} ${customer?.lastname ?? ""}`.trim()}
                onUnflagged={() => mutateCustomer()}
              />
            </div>
          )
        ) : (
          user?.role !== "kam" && (
            <div className="flex items-center justify-between bg-rose-50/50 border border-rose-100/50 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="deleteFlag"
                  className="cursor-pointer border-rose-300 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                  checked={isFlaged}
                  onCheckedChange={(value) => setIsFlaged(!!value)}
                />
                <Label htmlFor="deleteFlag" className="text-xs font-semibold text-rose-700 cursor-pointer">
                  علامت‌گذاری برای حذف
                </Label>
              </div>
              {isFlaged && (
                <Button
                  type="button"
                  variant="destructive"
                  className="h-7 px-3 text-[10px] shrink-0 rounded-lg bg-rose-600 hover:bg-rose-700 font-semibold"
                  onClick={() => setIsDeleteUserDialogOpen(true)}
                >
                  تایید حذف
                </Button>
              )}
            </div>
          )
        )}

        {/* Customer Note Box */}
        <div className="space-y-2 mt-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
              <InfoIcon className="w-4 h-4 text-amber-500" />
              <span>یادداشت مشتری:</span>
            </h3>
            {isCustomerNoteChanged && (
              <Button
                type="button"
                variant="outline"
                className="h-7 w-7 p-0 shrink-0 border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                onClick={handleUpdateNote}
              >
                <CheckIcon className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          <Textarea
            className="w-full min-h-[90px] text-xs border-yellow-200 bg-yellow-50/50 focus-visible:ring-yellow-300 rounded-xl leading-relaxed resize-none shadow-3xs"
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
      <div className="lg:flex-1 flex flex-col lg:h-full bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
        
        {/* Panel Header & Tab Switcher */}
        <div className="bg-slate-50/40 border-b border-slate-100 p-4 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-0.5">
            <h1 className="text-base font-bold text-slate-800">تاریخچه و جزئیات فعالیت‌ها</h1>
            <p className="text-xs text-slate-400">فضاهای کاری، بسته‌های اشتراک و گفتگوی پیگیری اپراتورها</p>
          </div>

          {/* Telegram-style Tab Pills */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("timeline")}
              className={cn(
                "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none",
                activeTab === "timeline"
                  ? "bg-white text-blue-600 shadow-3xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              <span>پیگیری‌ها (گفتگو)</span>
            </button>
            <button
              onClick={() => setActiveTab("workspaces")}
              className={cn(
                "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none",
                activeTab === "workspaces"
                  ? "bg-white text-blue-600 shadow-3xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Layers className="w-4 h-4" />
              <span>فضاهای کاری</span>
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={cn(
                "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none",
                activeTab === "subscriptions"
                  ? "bg-white text-blue-600 shadow-3xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Receipt className="w-4 h-4" />
              <span>اشتراک‌ها</span>
            </button>
          </div>
        </div>

        {/* Panel Content Body */}
        <div className="lg:flex-1 lg:min-h-0 flex flex-col bg-slate-50/20">
          
          {activeTab === "timeline" && (
            <div className="lg:flex-1 flex flex-col lg:h-full lg:overflow-hidden">

              {/* Timeline Messages container */}
              <div className="min-h-[360px] lg:flex-1 overflow-y-auto p-5 space-y-4 lg:min-h-0 flex flex-col scrollbar-thin scrollbar-thumb-slate-200">
                {actions?.items?.length > 0 ? (
                  <div className="space-y-4 flex flex-col">
                    {[...actions.items]
                      .sort(
                        (a, b) =>
                          new Date(a.actionDate).getTime() -
                          new Date(b.actionDate).getTime()
                      )
                      .map((action: Action) => {
                        const formattedDate = dayjs
                          .tz(action.actionDate, "Asia/Tehran")
                          .calendar("jalali")
                          .format("YYYY/MM/DD HH:mm");

                        const typeLabels: Record<string, string> = {
                          phone: "تلفن",
                          whatsapp: "واتسپ",
                          telegram: "تلگرام",
                          instagram: "اینستاگرم",
                        };

                        const typeIcons: Record<string, React.ReactNode> = {
                          phone: <PhoneCallIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />,
                          whatsapp: <WhatsappLogoIcon size={14} className="text-green-500 shrink-0" />,
                          telegram: <TelegramLogoIcon size={14} className="text-blue-500 shrink-0" />,
                          instagram: <InstagramLogoIcon size={14} className="text-pink-500 shrink-0" />,
                        };

                        const isDone = action.status === "done";

                        return (
                          <div
                            key={action.id}
                            className={cn(
                              "flex flex-col max-w-[80%] md:max-w-[70%] rounded-2xl p-3 shadow-3xs border transition-all duration-200",
                              isDone
                                ? "bg-slate-100/90 border-slate-200 text-slate-500 mr-auto rounded-tl-none"
                                : "bg-blue-50/90 border-blue-100 text-blue-900 ml-auto rounded-tr-none"
                            )}
                          >
                            {/* Message Header */}
                            <div className="flex items-center justify-between gap-6 text-[10px] font-bold mb-1.5 opacity-75">
                              <span className="flex items-center gap-1">
                                {typeIcons[action.type]}
                                <span>{typeLabels[action.type] ?? "نامشخص"}</span>
                              </span>
                              <span>{`${action.admin.firstname} ${action.admin.lastname}`}</span>
                            </div>

                            {/* Message Description */}
                            <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                              {action.description}
                            </p>

                            {/* Message Footer */}
                            <div className="flex items-center justify-between gap-4 text-[10px] mt-2.5 opacity-60 border-t pt-1.5 border-current/10">
                              <span>{formattedDate}</span>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1 cursor-pointer select-none font-semibold">
                                  <Checkbox
                                    className="w-3.5 h-3.5 rounded-sm border-current/30 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
                                    checked={isDone}
                                    onCheckedChange={async (checked) => {
                                      const newStatus = checked ? "done" : "todo";
                                      try {
                                        await api.post(`/actions/status/${action.id}`, {
                                          status: newStatus,
                                        });
                                        await mutateActions();
                                        toast.success("وضعیت عملیات به‌روز شد.");
                                      } catch {
                                        toast.error("خطا در به‌روزرسانی وضعیت.");
                                      }
                                    }}
                                  />
                                  <span>انجام شد</span>
                                </label>
                                
                                {user.role !== "kam" && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-5 h-5 p-0 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md"
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
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
                    <MessageSquare className="w-12 h-12 stroke-[1.2] mb-2 opacity-50" />
                    <p className="text-xs font-semibold">در حال حاضر هیچ عملیاتی وجود ندارد.</p>
                    <p className="text-[10px] text-slate-400/80 mt-1 max-w-sm text-center">
                      پس از ثبت اولین عملیات وضعیت این سرنخ بطور خودکار به (پیگیری) تغییر خواهد کرد.
                    </p>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="border-t bg-white p-3.5 space-y-3 shrink-0 shadow-lg">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Date Picker */}
                  <div className="w-auto">
                    <DatePicker date={selectedDate} onChange={setSelectedDate} />
                  </div>

                  {/* Action Type Select */}
                  <div className="w-36">
                    <Select value={actionType} onValueChange={setActionType}>
                      <SelectTrigger className="w-full bg-white h-9 rounded-xl border border-slate-200 px-3 text-xs focus-visible:ring-indigo-500 shadow-3xs cursor-pointer">
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

                  {/* Textarea note & submit button */}
                  <div className="flex-1 flex gap-2.5 min-w-0 w-full sm:w-auto">
                    <Textarea
                      className="min-h-9 max-h-16 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus-visible:ring-blue-500 shadow-3xs leading-relaxed"
                      placeholder="شرح پیگیری را اینجا بنویسید..."
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                    />

                    <Button
                      type="button"
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 rounded-xl px-4 h-9 text-xs font-bold transition-all duration-150 cursor-pointer shadow-sm"
                      disabled={isSavingAction}
                      onClick={handleAddAction}
                    >
                      {isSavingAction ? "ارسال..." : "ثبت پیگیری"}
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === "workspaces" && (
            <div className="min-h-[360px] lg:flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
              {isWorkspacesLoading ? (
                <div className="flex justify-center py-10"><Loading /></div>
              ) : workspaces.length > 0 ? (
                <div className="space-y-3.5">
                  {workspaces.map((ws: any) => (
                    <WorkspaceCard key={ws.workspaceId} workspace={ws} />
                  ))}

                  {/* Workspaces Pagination Controls */}
                  {workspacesMeta && workspacesMeta.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-5 bg-white border border-slate-100 p-3 rounded-xl shadow-3xs">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-8 text-xs font-semibold cursor-pointer"
                        disabled={workspacesPage <= 1}
                        onClick={() => setWorkspacesPage(prev => Math.max(prev - 1, 1))}
                      >
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        <span>قبلی</span>
                      </Button>
                      <span className="text-xs font-bold text-slate-500">
                        صفحه {workspacesPage} از {workspacesMeta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-8 text-xs font-semibold cursor-pointer"
                        disabled={workspacesPage >= workspacesMeta.totalPages}
                        onClick={() => setWorkspacesPage(prev => Math.min(prev + 1, workspacesMeta.totalPages))}
                      >
                        <span>بعدی</span>
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 py-16">
                  <Layers className="w-12 h-12 stroke-[1.2] mb-2 opacity-50" />
                  <p className="text-xs font-semibold">کاربر در هیچ فضای کاری عضو نیست.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "subscriptions" && (
            <div className="min-h-[360px] lg:flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
              {isSubsLoading ? (
                <div className="flex justify-center py-10"><Loading /></div>
              ) : subs.length > 0 ? (
                <div className="space-y-4">
                  {subs.map((sub: any) => (
                    <SubscriptionCard key={sub.id} subscription={sub} />
                  ))}

                  {/* Subscriptions Pagination Controls */}
                  {subsMeta && subsMeta.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-5 bg-white border border-slate-100 p-3 rounded-xl shadow-3xs">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-8 text-xs font-semibold cursor-pointer"
                        disabled={subsPage <= 1}
                        onClick={() => setSubsPage(prev => Math.max(prev - 1, 1))}
                      >
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        <span>قبلی</span>
                      </Button>
                      <span className="text-xs font-bold text-slate-500">
                        صفحه {subsPage} از {subsMeta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-8 text-xs font-semibold cursor-pointer"
                        disabled={subsPage >= subsMeta.totalPages}
                        onClick={() => setSubsPage(prev => Math.min(prev + 1, subsMeta.totalPages))}
                      >
                        <span>بعدی</span>
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 py-16">
                  <Receipt className="w-12 h-12 stroke-[1.2] mb-2 opacity-50" />
                  <p className="text-xs font-semibold">هیچ اشتراکی برای این کاربر ثبت نشده است.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Dialogs & Overlays */}
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
        userId={customer?.id || ""}
      />
    </div>
  );
}

/* Internal Components for Workspaces and Subscriptions list items */

function IgTokenBadge({ isValid }: { isValid?: boolean }) {
  return (
    <span
      className={cn(
        "text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0",
        isValid
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-rose-50 text-rose-700 border-rose-100"
      )}
    >
      {isValid ? "متصل" : "قطع"}
    </span>
  );
}

function WorkspaceCard({ workspace }: { workspace: any }) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = dayjs(workspace.joinedAt)
    .calendar("jalali")
    .format("YYYY/MM/DD");

  const isOwner = workspace.role === "owner";

  // Dynamic colors for workspace letter avatars
  const getAvatarColor = (name: string) => {
    const colors = [
      "from-emerald-500 to-teal-600",
      "from-teal-500 to-cyan-600",
      "from-cyan-500 to-sky-600",
      "from-sky-500 to-blue-600",
      "from-blue-500 to-indigo-600",
      "from-indigo-500 to-violet-600",
      "from-violet-500 to-purple-600",
      "from-purple-500 to-pink-600",
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-2xs hover:shadow-xs transition-shadow duration-150">
      <div 
        className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {/* Avatar Icon */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs bg-gradient-to-tr",
            getAvatarColor(workspace.workspaceName)
          )}>
            {workspace.workspaceName.slice(0, 2)}
          </div>
          
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">{workspace.workspaceName}</span>
              {workspace.isPersonal && (
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold">شخصی</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
              <span>تاریخ عضویت: {formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Badge */}
          <span className={cn(
            "text-[10px] px-2.5 py-0.5 rounded-full font-bold border",
            isOwner
              ? "bg-purple-50 text-purple-700 border-purple-100"
              : "bg-blue-50 text-blue-700 border-blue-100"
          )}>
            {isOwner ? "مالک" : "عضو"}
          </span>

          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-50 bg-slate-50/20 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>دسترسی‌ها و مجوزها:</span>
          </div>

          {isOwner ? (
            <p className="text-xs text-emerald-600 font-semibold bg-emerald-50/50 border border-emerald-100/60 px-3 py-2 rounded-xl flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              این کاربر مالک فضای کاری است و دسترسی کامل به تمامی بخش‌ها دارد.
            </p>
          ) : workspace.permissions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {workspace.permissions.map((p: any) => (
                <div key={p.slug} className="flex items-start gap-2 p-2 bg-white border border-slate-100 rounded-xl shadow-3xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></span>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700 block" dir="ltr">{p.slug}</span>
                    <span className="text-[10px] text-slate-400 block leading-tight font-medium">{p.description || "بدون توضیحات"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-600 bg-amber-50/50 border border-amber-100/60 px-3 py-2 rounded-xl">
              هیچ دسترسی خاصی برای این عضو تعریف نشده است.
            </p>
          )}

          {workspace.instagrams?.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold">
                <InstagramLogoIcon size={16} className="text-pink-600" />
                <span>اینستاگرام‌ها:</span>
              </div>
              <div className="space-y-1.5">
                {workspace.instagrams.map((ig: any) => (
                  <div
                    key={ig.id}
                    className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-100 rounded-xl shadow-3xs"
                  >
                    <a
                      className="text-slate-600 hover:text-indigo-600 flex items-center gap-2 text-xs font-semibold transition-colors min-w-0"
                      href={`https://instagram.com/${ig.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                    >
                      <InstagramLogoIcon size={16} className="text-pink-600 shrink-0" />
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

  const createDate = dayjs(subscription.createDate)
    .calendar("jalali")
    .format("YYYY/MM/DD HH:mm");

  const expireDate = subscription.expire
    ? dayjs(subscription.expire).calendar("jalali").format("YYYY/MM/DD")
    : "نامحدود";

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      active: { label: "فعال", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
      reserved: { label: "رزرو", className: "bg-blue-50 text-blue-700 border-blue-100" },
      expired: { label: "منقضی شده", className: "bg-rose-50 text-rose-700 border-rose-100" },
      pending: { label: "در انتظار", className: "bg-amber-50 text-amber-700 border-amber-100" },
      canceled: { label: "لغو شده", className: "bg-slate-100 text-slate-600 border-slate-200" },
    };

    const item = config[status] || { label: status, className: "bg-slate-50 text-slate-600" };
    return (
      <span className={cn("text-[10px] px-2.5 py-0.5 rounded-full font-bold border", item.className)}>
        {item.label}
      </span>
    );
  };

  const planName = subscription.planDuration?.plan?.name || "بسته عمومی";
  const durationName = subscription.planDuration?.name || "سفارشی";
  const price = subscription.planDuration?.price || 0;

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-2xs hover:shadow-xs transition-shadow duration-150">
      <div 
        className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {/* Card Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Receipt size={18} className="stroke-[1.8]" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">{planName} ({durationName})</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-slate-400 font-semibold">
              <span>شروع: {createDate}</span>
              <span className="hidden md:inline">•</span>
              <span>انقضا: {expireDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(subscription.status)}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-50 bg-slate-50/20 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block">شناسه اشتراک</span>
              <span className="font-mono text-slate-700 block" dir="ltr">{subscription.id}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block">فضای کاری</span>
              <span className="font-bold text-slate-700 block">{subscription.workspaceName}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block">مبلغ بسته</span>
              <span className="font-bold text-slate-800 block text-indigo-700">{formatNumber(price)} ریال</span>
            </div>
          </div>

          {/* Invoices inside Subscription */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-indigo-500" />
              <span>صورتحساب‌های پرداخت شده:</span>
            </div>

            {subscription.invoices && subscription.invoices.length > 0 ? (
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-3xs">
                <Table className="text-[11px] leading-tight">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-right py-2">شناسه فاکتور</TableHead>
                      <TableHead className="text-right py-2">مبلغ</TableHead>
                      <TableHead className="text-right py-2">وضعیت</TableHead>
                      <TableHead className="text-right py-2">روش پرداخت</TableHead>
                      <TableHead className="text-right py-2">تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscription.invoices.map((inv: any) => {
                      const invDate = dayjs(inv.createDate)
                        .calendar("jalali")
                        .format("YYYY/MM/DD HH:mm");

                      const payMethodLabels: Record<string, string> = {
                        card: "کارت به کارت",
                        zarinpal: "زرین‌پال",
                        manual: "ثبت دستی",
                      };

                      const invStatusLabels: Record<string, { label: string; className: string }> = {
                        paid: { label: "پرداخت شده", className: "text-emerald-600 font-semibold" },
                        pending: { label: "در انتظار پرداخت", className: "text-amber-600 font-semibold" },
                        failed: { label: "ناموفق", className: "text-rose-600 font-semibold" },
                      };

                      const invStatus = invStatusLabels[inv.status] || { label: inv.status, className: "text-slate-600" };

                      return (
                        <TableRow key={inv.id} className="hover:bg-slate-50/30">
                          <TableCell className="py-2 font-mono">{inv.id}</TableCell>
                          <TableCell className="py-2 font-bold">{formatNumber(inv.amount)} ریال</TableCell>
                          <TableCell className={cn("py-2", invStatus.className)}>{invStatus.label}</TableCell>
                          <TableCell className="py-2">{payMethodLabels[inv.paymentMethod] || inv.paymentMethod || "نامشخص"}</TableCell>
                          <TableCell className="py-2">{invDate}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 bg-white border border-slate-100 p-3 rounded-xl text-center">صورتحسابی ثبت نشده است.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
