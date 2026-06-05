// src/app/leads/[id]/page.tsx
"use client";

import api, { fetcher } from "@/hooks/swr/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useKams } from "@/hooks/use-kams";
import { formatNumber } from "@/lib/formatNumber";
import { MarketingLead } from "@/types/lead";
import { User } from "@/types/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import useSWR from "swr";
import z from "zod";
import dayjs from "@/lib/dayjs-jalali";
import { cn } from "@/lib/utils";
import React from "react";

// UI Imports
import { FetchError } from "@/components/fetch-error";
import { Loading } from "@/components/loading";
import { StatusBadge } from "@/components/table/status-badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChatCenteredTextIcon,
  CrosshairSimpleIcon,
  InstagramLogoIcon,
  PencilSimpleLineIcon,
  TelegramLogoIcon,
  TrashIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { CheckIcon, PhoneCallIcon } from "lucide-react";
import { Action } from "@/types/actions";
import { SendSMSDialog } from "@/components/table/dialog-sms";
import DialogFormLead from "../dialog-form-lead";
import DialogDelete from "@/components/dialog-delete";

const FormSchema = z.object({
  status: z.string().min(1, { message: "وضعیت را انتخاب کنید." }),
  admin: z.string().min(1),
});

export default function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [dialogLeadFormOpen, setDialogLeadFormOpen] = useState(false);
  const [dialogDeleteOpen, setDialogDeleteOpen] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [isStatusChanged, setIsStatusChanged] = useState(false);
  const [isAdminChanged, setIsAdminChanged] = useState(false);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>();
  const [actionType, setActionType] = useState<string>("");
  const [marketingLeadNote, setMarketingLeadNote] = useState<string>("");
  const [isMarketingLeadNoteChanged, setIsMarketingLeadNoteChanged] =
    useState(false);
  const [note, setNote] = useState<string>("");
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
    roles: "manager,kam",
    enabled: user?.role !== "kam",
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
      status: "",
      admin: "",
    },
  });

  useEffect(() => {
    if (marketingLead) {
      form.reset({
        status: marketingLead?.status,
        admin: marketingLead?.marketingLeadsAdmins.find(
          (admin) => admin.isActive,
        )?.adminId,
      });
    }
  }, [marketingLead, form]);

  const handleUpdateStatus = async () => {
    try {
      const status = form.getValues("status");

      await api.patch(`/marketingLeads/status/${id}`, {
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

      await api.post("/marketingLeads/assignAdmin", {
        adminId,
        marketingLeadIds: [id],
      });

      setIsAdminChanged(false);
      toast.success("مسئول با موفقیت تغییر کرد");
    } catch (error) {
      console.error(error);
      toast.error("خطا در تغییر مسئول");
    }
  };

  const handleAddAction = async () => {
    if (!selectedDate || !actionType || note.trim() === "") {
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
      for: "marketingLead",
      type: actionType,
      description: note.trim(),
      status: "todo",
    };

    try {
      await api.post("/actions", payload);
      setSelectedDate(undefined);
      setActionType("");
      setNote("");
      await mutateActions();
      await mutateLead();
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
    if (marketingLead?.note !== undefined) {
      setMarketingLeadNote(marketingLead.note);
    }
  }, [marketingLead]);

  const handleUpdateNote = async () => {
    try {
      await api.patch(`/marketingLeads/${id}`, { note: marketingLeadNote });
      setIsMarketingLeadNoteChanged(false);
      toast.success("یادداشت با موفقیت به‌روز شد.");
    } catch (error) {
      console.error("خطا در آپدیت یادداشت:", error);
      toast.error("خطا در ذخیره‌سازی");
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
  if (!form.getValues("status")) return <p>ارور</p>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 h-[calc(100vh-40px)] overflow-hidden bg-slate-50/20" dir="rtl">

      {/* Left Column: Profile Sidebar */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col gap-5 overflow-y-auto pr-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs scrollbar-thin scrollbar-thumb-slate-200">

        {/* Profile Header */}
        <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md border-4 border-white">
            {marketingLead
              ? `${marketingLead.firstname?.[0] || ""}${marketingLead.lastname?.[0] || ""}`
              : "م"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {!marketingLead?.firstname && !marketingLead?.lastname
                ? "ثبت نشده است"
                : `${marketingLead?.firstname ?? ""} ${marketingLead?.lastname ?? ""}`}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5" dir="ltr">
              {marketingLead?.mobile || ""}
            </p>
          </div>

          {/* Quick Action Circle Buttons */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <a
              href={`tel:${marketingLead?.mobile}`}
              className="w-9 h-9 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center border border-slate-200/60 shadow-3xs transition-all duration-150"
              title="تماس تلفنی"
            >
              <PhoneCallIcon className="w-4 h-4" />
            </a>
            <button
              onClick={handleOpenSmsDialog}
              className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center border border-blue-100 shadow-3xs transition-all duration-150"
              title="ارسال پیامک"
            >
              <ChatCenteredTextIcon size={18} />
            </button>
            <a
              href={`https://t.me/+98${marketingLead?.mobile?.replace(/^0/, "")}`}
              className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 hover:bg-sky-100 flex items-center justify-center border border-sky-100 shadow-3xs transition-all duration-150"
              target="_blank"
              rel="noopener noreferrer"
              title="تلگرام"
            >
              <TelegramLogoIcon size={18} />
            </a>
            <a
              href={`https://wa.me/98${marketingLead?.mobile?.replace(/^0/, "")}`}
              className="w-9 h-9 rounded-full bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center border border-green-100 shadow-3xs transition-all duration-150"
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
            <h4 className="text-xs text-slate-400 font-semibold">اطلاعات اینستاگرام:</h4>
            <a
              className="text-slate-600 hover:text-indigo-600 flex items-center gap-2 text-xs font-semibold p-2 bg-slate-50 rounded-xl border border-slate-100 transition-colors"
              href={`https://instagram.com/${marketingLead.instagram.username}`}
              target="_blank"
              dir="ltr"
            >
              <InstagramLogoIcon size={18} className="text-pink-600 shrink-0" />
              <span>@{marketingLead.instagram.username}</span>
            </a>
            {marketingLead.instagram.name && (
              <p className="text-xs text-slate-500 font-medium px-1">{marketingLead.instagram.name}</p>
            )}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-3xs text-center space-y-0.5">
                <span className="text-slate-400 block text-[10px]">فالوور</span>
                <span className="font-bold text-slate-800 block">{formatNumber(marketingLead.instagram.followersCount)}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-3xs text-center space-y-0.5">
                <span className="text-slate-400 block text-[10px]">فالووینگ</span>
                <span className="font-bold text-slate-800 block">{formatNumber(marketingLead.instagram.followsCount)}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-3xs text-center space-y-0.5">
                <span className="text-slate-400 block text-[10px]">پست</span>
                <span className="font-bold text-slate-800 block">{formatNumber(marketingLead.instagram.mediaCount)}</span>
              </div>
            </div>
            {marketingLead.category && (
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-xs text-slate-500">دسته‌بندی:</span>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
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
                    <FormLabel className="text-xs text-slate-500 font-semibold">وضعیت سرنخ</FormLabel>
                    <div className="flex gap-2 items-center">
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setIsStatusChanged(true);
                        }}
                        value={field.value}
                        disabled={marketingLead?.status === "incoming"}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full bg-white h-9 rounded-xl border border-slate-200 px-3 text-sm shadow-2xs">
                            <SelectValue placeholder="انتخاب وضعیت">
                              <StatusBadge status={field.value} />
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="follow"><StatusBadge status="follow" /></SelectItem>
                          <SelectItem value="force"><StatusBadge status="force" /></SelectItem>
                          <SelectItem value="failed"><StatusBadge status="failed" /></SelectItem>
                        </SelectContent>
                      </Select>
                      {isStatusChanged && (
                        <Button
                          type="button"
                          className="h-9 w-9 p-0 shrink-0 rounded-xl"
                          onClick={handleUpdateStatus}
                        >
                          <CheckIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </FormItem>
                )}
              />

              {user?.role !== "kam" && (
                <FormField
                  control={form.control}
                  name="admin"
                  render={({ field }) => {
                    const selectedKam = kams.find((kam: User) => kam.id === field.value);
                    const adminKam = marketingLead?.marketingLeadsAdmins.find((a) => a.isActive);
                    const adminFullName = adminKam
                      ? `${adminKam.admin.firstname} ${adminKam.admin.lastname}`
                      : "بدون مسئول";

                    return (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs text-slate-500 font-semibold">مسئول پیگیری (اپراتور)</FormLabel>
                        <div className="flex gap-2 items-center">
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setIsAdminChanged(true);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full bg-white h-9 rounded-xl border border-slate-200 px-3 text-sm shadow-2xs">
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
                              className="h-9 w-9 p-0 shrink-0 rounded-xl"
                              onClick={handleUpdateAdmin}
                            >
                              <CheckIcon className="w-4 h-4" />
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
          <PencilSimpleLineIcon className="w-4 h-4 ml-1" />
          ویرایش اطلاعات سرنخ
        </Button>

        {/* Note Textarea */}
        <div className="space-y-2 mt-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 text-xs">یادداشت سرنخ:</h3>
            {isMarketingLeadNoteChanged && (
              <Button
                type="button"
                className="h-7 w-7 p-0 shrink-0 rounded-lg"
                onClick={handleUpdateNote}
              >
                <CheckIcon className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          <Textarea
            className="w-full min-h-[90px] text-xs border-yellow-200 bg-yellow-50/50 focus-visible:ring-yellow-300 rounded-xl leading-relaxed resize-none shadow-3xs"
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
      <div className="flex-1 flex flex-col h-full bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">

        {/* Panel Header */}
        <div className="bg-slate-50/40 border-b border-slate-100 p-4 shrink-0">
          <div className="space-y-0.5">
            <h1 className="text-base font-bold text-slate-800">تاریخچه و جزئیات فعالیت‌ها</h1>
            <p className="text-xs text-slate-400">ثبت و پیگیری عملیات‌های فروش</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col bg-slate-50/20">

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 flex flex-col scrollbar-thin scrollbar-thumb-slate-200">
            {actions?.items?.length > 0 ? (
              <div className="space-y-4 flex flex-col">
                {[...actions.items]
                  .sort((a, b) => new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime())
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
                        <div className="flex items-center justify-between gap-6 text-[10px] font-bold mb-1.5 opacity-75">
                          <span className="flex items-center gap-1">
                            {typeIcons[action.type]}
                            <span>{typeLabels[action.type] ?? "نامشخص"}</span>
                          </span>
                          <span>{`${action.admin.firstname} ${action.admin.lastname}`}</span>
                        </div>

                        <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                          {action.description}
                        </p>

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
                                    await api.post(`/actions/status/${action.id}`, { status: newStatus });
                                    await mutateActions();
                                    toast.success("وضعیت عملیات به‌روز شد.");
                                  } catch {
                                    toast.error("خطا در به‌روزرسانی وضعیت.");
                                  }
                                }}
                              />
                              <span>انجام شد</span>
                            </label>
                            {user?.role !== "kam" && (
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
                <CrosshairSimpleIcon size={48} className="mb-2 opacity-50" />
                <p className="text-xs font-semibold">در حال حاضر هیچ عملیاتی وجود ندارد.</p>
                <p className="text-[10px] text-slate-400/80 mt-1 max-w-sm text-center">
                  پس از ثبت اولین عملیات وضعیت این سرنخ بطور خودکار به (پیگیری) تغییر خواهد کرد.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Input Bar */}
          <div className="border-t bg-white p-3.5 space-y-3 shrink-0 shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-auto">
                <DatePicker date={selectedDate} onChange={setSelectedDate} />
              </div>
              <div className="w-36">
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger className="w-full bg-white h-9 rounded-xl border border-slate-200 px-3 text-xs shadow-3xs cursor-pointer">
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
              <div className="flex-1 flex gap-2.5 min-w-[260px]">
                <Textarea
                  className="min-h-9 max-h-16 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus-visible:ring-blue-500 shadow-3xs leading-relaxed"
                  placeholder="شرح پیگیری را اینجا بنویسید..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 rounded-xl px-4 h-9 text-xs font-bold cursor-pointer shadow-sm"
                  disabled={isSavingAction}
                  onClick={handleAddAction}
                >
                  {isSavingAction ? "ارسال..." : "ثبت پیگیری"}
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
