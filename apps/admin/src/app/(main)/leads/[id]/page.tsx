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

// UI Imports
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FetchError } from "@/components/fetch-error";
import { Loading } from "@/components/loading";
import { StatusBadge } from "@/components/table/status-badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form";
import {
  ChatCenteredTextIcon,
  CrosshairSimpleIcon,
  HeartIcon,
  InstagramLogoIcon,
  PencilSimpleLineIcon,
  TelegramLogoIcon,
  TrashIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { CheckIcon } from "lucide-react";
import { Action } from "@/types/actions";
import { SendSMSDialog } from "@/components/table/dialog-sms";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
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
    if (marketingLead?.note) {
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
    <div className="flex-1 rounded-xl border p-4 text-sm">
      <div className="_lead-info flex w-full flex-wrap gap-5 border-b pb-4 md:flex-nowrap">
        <div className="md:w-3/11">
          <div className="_details space-y-2.5">
            <div className="_name flex items-center gap-1">
              <span>نام مشتری: </span>
              <span className="font-semibold">
                {!marketingLead?.firstname && !marketingLead?.lastname
                  ? "ثبت نشده است"
                  : `${marketingLead?.firstname ?? ""} ${marketingLead?.lastname ?? ""}`}
              </span>
              <PencilSimpleLineIcon
                className="hover:text-primary mr-3 cursor-pointer text-gray-500"
                size={20}
                onClick={() => setDialogLeadFormOpen(true)}
              />
            </div>

            <div className="_contact flex items-center gap-3">
              <p>
                <span>همراه: </span>
                <a
                  className="text-secondary hover:text-primary text-base font-semibold underline-offset-4 hover:underline"
                  href={`tel:${marketingLead?.mobile}`}
                >
                  {!marketingLead?.mobile
                    ? "ثبت نشده است"
                    : marketingLead?.mobile}
                </a>
              </p>
              <div
                className="text-secondary cursor-pointer hover:text-black"
                onClick={handleOpenSmsDialog}
              >
                <ChatCenteredTextIcon size={22} />
              </div>
              <a
                href={`https://t.me/+98${marketingLead?.mobile?.replace(/^0/, "")}`}
                className="text-blue-600 hover:text-black"
                target="_blank"
                rel="noopener noreferrer"
              >
                <TelegramLogoIcon size={22} />
              </a>
              <a
                href={`https://wa.me/98${marketingLead?.mobile?.replace(/^0/, "")}`}
                className="text-green-600 hover:text-black"
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsappLogoIcon size={22} />
              </a>
            </div>

            <Form {...form}>
              <form className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-3">
                        <FormLabel>وضعیت</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setIsStatusChanged(true);
                          }}
                          value={field.value}
                          disabled={marketingLead?.status === "incoming"}
                        >
                          <FormControl>
                            <SelectTrigger className="h-6 cursor-pointer border-0 p-0 shadow-none">
                              <SelectValue>
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
                            variant="outline"
                            size={"sm"}
                            color="success"
                            icon
                            onClick={handleUpdateStatus}
                          >
                            <CheckIcon />
                          </Button>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                {user?.role !== "kam" && (
                  <div className="flex items-center gap-3">
                    <FormField
                      control={form.control}
                      name="admin"
                      render={({ field }) => {
                        const selectedKam = kams.find(
                          (kam: User) => kam.id === field.value,
                        );

                        const adminKam =
                          marketingLead?.marketingLeadsAdmins.find(
                            (a) => a.isActive,
                          );
                        const adminFullName = adminKam
                          ? `${adminKam.admin.firstname} ${adminKam.admin.lastname}`
                          : "بدون مسئول";

                        return (
                          <FormItem className="flex flex-row items-center gap-3">
                            <FormLabel>مسئول</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setIsAdminChanged(true);
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-6 cursor-pointer border-0 p-0 shadow-none">
                                  <SelectValue placeholder="انتخاب کنید">
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
                          </FormItem>
                        );
                      }}
                    />
                    {isAdminChanged && (
                      <Button
                        type="button"
                        variant="outline"
                        size={"sm"}
                        color="success"
                        icon
                        onClick={handleUpdateAdmin}
                      >
                        <CheckIcon />
                      </Button>
                    )}
                  </div>
                )}
              </form>
            </Form>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:w-5/11">
          {marketingLead?.instagram.name && (
            <p className="text-sidebar-foreground md:text-center">
              {marketingLead?.instagram.name}
            </p>
          )}

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-center">
            <a
              className="text-secondary hover:text-primary flex items-start gap-1.5 font-semibold underline-offset-4 hover:underline md:items-center"
              href={`https://instagram.com/${marketingLead?.instagram.username}`}
              target="_blank"
            >
              <InstagramLogoIcon size={22} />
              <span className="text-base" dir="ltr">
                {marketingLead?.instagram.username}
              </span>
            </a>

            <div>
              <span>در دسته‌بندی </span>
              <span className="font-semibold">
                {marketingLead?.category
                  ? marketingLead?.category?.name
                  : "نامشخص"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-center">
            <div className="flex gap-1.5">
              <span className="font-semibold">
                {formatNumber(marketingLead?.instagram.followersCount)}
              </span>
              <span className="text-sm">فالوور</span>
            </div>
            <span className="hidden md:block">|</span>
            <div className="flex gap-1.5">
              <span className="font-semibold">
                {formatNumber(marketingLead?.instagram.followsCount)}
              </span>
              <span className="text-sm">فالووینگ</span>
            </div>
            <span className="hidden md:block">|</span>
            <div className="flex gap-1.5">
              <span className="font-semibold">
                {formatNumber(marketingLead?.instagram.mediaCount)}
              </span>
              <span className="text-sm">تعداد پست</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-3/11">
          <div className="customer_note flex h-full flex-1 flex-col">
            <div className="flex items-center justify-between">
              <h2 className="mb-2 font-semibold">یادداشت:</h2>
              {isMarketingLeadNoteChanged && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  color="success"
                  icon
                  onClick={handleUpdateNote}
                >
                  <CheckIcon />
                </Button>
              )}
            </div>
            <Textarea
              className="flex-1 border-yellow-200 bg-yellow-50"
              value={marketingLeadNote}
              onChange={(e) => {
                setMarketingLeadNote(e.target.value);
                setIsMarketingLeadNoteChanged(true);
              }}
            />
          </div>
        </div>
      </div>

      <div className="_lead-actions py-4">
        <div className="flex flex-wrap gap-3">
          <h2 className="text-sidebar-foreground flex items-center gap-1 text-base font-semibold md:mb-3">
            <CrosshairSimpleIcon size={22} />
            <span>عملیات‌ها {`[${actions?.items?.length}]`}</span>
          </h2>

          <div className="mb-3 grid w-full grid-cols-2 flex-wrap gap-2 md:flex md:flex-1">
            <DatePicker date={selectedDate} onChange={setSelectedDate} />

            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="w-full bg-white md:w-[180px]">
                <SelectValue placeholder="نوع عملیات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">اینستاگرم</SelectItem>
                <SelectItem value="telegram">تلگرام</SelectItem>
                <SelectItem value="whatsapp">واتسپ</SelectItem>
                <SelectItem value="phone">تلفن</SelectItem>
              </SelectContent>
            </Select>
            <div className="col-span-2 flex gap-2 md:flex-1">
              <Textarea
                className="min-h-9 flex-1 pb-1.5"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              <Button
                type="button"
                variant="outline"
                color="success"
                icon
                disabled={isSavingAction}
                onClick={() => {
                  handleAddAction();
                }}
              >
                <CheckIcon />
              </Button>
            </div>
          </div>
        </div>

        <div className="_actions-list">
          {actions?.items?.length > 0 ? (
            <Table className="overflow-auto">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <HeartIcon
                      size={18}
                      className="mx-auto animate-pulse text-red-700"
                      weight="duotone"
                    />
                  </TableHead>
                  <TableHead className="w-[100px]">تاریخ</TableHead>
                  <TableHead className="w-[140px]">اپراتور</TableHead>
                  <TableHead className="w-[100px]">نوع</TableHead>
                  <TableHead className="text-right">توضیحات</TableHead>
                  {user.role !== "kam" && (
                    <TableHead className="w-[60px]">حذف</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...actions.items]
                  .sort(
                    (a, b) =>
                      new Date(b.actionDate).getTime() -
                      new Date(a.actionDate).getTime(),
                  )
                  .map((action: Action) => {
                    const formattedDate = dayjs
                      .tz(action.actionDate, "Asia/Tehran")
                      .calendar("jalali")
                      .format("YYYY/MM/DD");

                    const typeLabels: Record<string, string> = {
                      phone: "تلفن",
                      whatsapp: "واتسپ",
                      telegram: "تلگرام",
                      instagram: "اینستاگرم",
                    };

                    return (
                      <TableRow
                        key={action.id}
                        className={cn(
                          action.status === "done" &&
                            "bg-muted/75 text-muted-foreground/75",
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            className={cn(
                              action?.status === "done" &&
                                "data-[state=checked]:border-gray-400/75 data-[state=checked]:bg-gray-400/75",
                              "cursor-pointer",
                            )}
                            checked={action.status === "done"}
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
                        </TableCell>
                        <TableCell className="font-medium">
                          {formattedDate}
                        </TableCell>
                        <TableCell>{`${action.admin.firstname} ${action.admin.lastname}`}</TableCell>

                        <TableCell>
                          {typeLabels[action.type] ?? "نامشخص"}
                        </TableCell>
                        <TableCell className="text-right">
                          {action.description}
                        </TableCell>
                        {user.role !== "kam" && (
                          <TableCell>
                            <Button
                              type="button"
                              variant="link"
                              color="destructive"
                              className="hover:text-red-500"
                              icon
                              onClick={() => {
                                setSelectedActionId(action.id);
                                setDialogDeleteOpen(true);
                              }}
                            >
                              <TrashIcon />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground pt-3 text-center text-sm">
              در حال حاضر هیچ عملیاتی وجود ندارد. پس از ثبت اولین عملیات وضعیت
              این سرنخ بطور خودکار به (پیگیری) تغییر خواهد کرد.
            </p>
          )}
        </div>
      </div>

      <SendSMSDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        smsData={smsData}
        recipientType="marketingLead"
      />

      {selectedActionId && (
        <DialogDelete
          open={dialogDeleteOpen}
          onOpenChange={(open) => {
            setDialogDeleteOpen(open);
            if (!open) setSelectedActionId(null); // cleanup
          }}
          onConfirm={() => handleDeleteAction(selectedActionId)}
        />
      )}

      <DialogFormLead
        open={dialogLeadFormOpen}
        onOpenChange={setDialogLeadFormOpen}
        data={marketingLead}
        mutate={mutateLead}
      />
    </div>
  );
}
