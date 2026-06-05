"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/hooks/swr/api-client";
import { toast } from "sonner";
import {
  MessageSquare,
  RefreshCw,
  X,
  User as UserIcon,
  Bot,
  Cpu,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Terminal,
  PauseCircle,
  Ban,
  PlayCircle,
  Check,
} from "lucide-react";
import { ColumnDef, Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { LayoutTable } from "@/components/layout/LayoutTable";
import { DataTable } from "@/components/table/data-table";
import { DataTablePagination } from "@/components/table/pagination";

interface ChatType {
  id: string;
  telegramId: string;
  firstName: string;
  lastName: string;
  username: string;
  status: "active" | "sleep" | "responding" | "disabled";
  sleepUntil: string | null;
  totalTokensIn: number;
  totalTokensOut: number;
  totalMoneySpent: number;
  createdAt: string;
  updatedAt: string;
}

interface MessageType {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokensIn: number;
  tokensOut: number;
  moneySpent: number;
  createdAt: string;
}

interface LogType {
  id: string;
  provider: string;
  model: string;
  requestPayload: string;
  responsePayload: string;
  statusCode: number;
  errorMessage: string | null;
  createdAt: string;
}

const formatRemaining = (until: string | null): string => {
  if (!until) return "";
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return "";
  const mins = Math.round(ms / 60000);
  if (mins >= 60) return `${Math.round(mins / 60)} ساعت`;
  return `${mins} دقیقه`;
};

function StatusBadge({ chat }: { chat: ChatType }) {
  if (chat.status === "responding") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <span className="flex gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
        در حال پاسخ‌دهی...
      </span>
    );
  }
  if (chat.status === "disabled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
        <Ban className="h-3 w-3" />
        غیرفعال دائمی
      </span>
    );
  }
  if (chat.status === "sleep") {
    const remaining = formatRemaining(chat.sleepUntil);
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        {remaining ? `متوقف (${remaining} دیگر)` : "متوقف"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      فعال
    </span>
  );
}

export default function ChatsPage() {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [tableInstance, setTableInstance] = useState<Table<ChatType> | null>(null);

  const [usdToIrtRate, setUsdToIrtRate] = useState<number | null>(null);
  const [irtRateInput, setIrtRateInput] = useState("");
  const [irtRateSaving, setIrtRateSaving] = useState(false);
  const [irtRateSaved, setIrtRateSaved] = useState(false);

  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [activeTab, setActiveTab] = useState<"chat" | "logs">("chat");
  const [logs, setLogs] = useState<LogType[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<{ id: string; action: "pause" | "disable" | "resume" } | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/telegram-automation/settings").then(({ data }) => {
      const rate = data?.data?.usdToIrtRate ?? data?.usdToIrtRate ?? null;
      if (rate) {
        setUsdToIrtRate(rate);
        setIrtRateInput(String(rate));
      }
    }).catch(() => {});
  }, []);

  const handleIrtRateSave = async () => {
    const val = Number(irtRateInput.replace(/,/g, ""));
    if (!val || isNaN(val) || val <= 0) return;
    setIrtRateSaving(true);
    try {
      await api.patch("/telegram-automation/settings/usd-irt-rate", { usdToIrtRate: val });
      setUsdToIrtRate(val);
      setIrtRateSaved(true);
      setTimeout(() => setIrtRateSaved(false), 2000);
    } catch {
      toast.error("خطا در ذخیره نرخ دلار");
    } finally {
      setIrtRateSaving(false);
    }
  };

  const fetchChats = async (pageNum: number) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/telegram-automation/chats?page=${pageNum}&limit=${limit}`);
      const payload = data?.data || data || {};
      const list = payload.items || [];
      const meta = payload.meta || {};
      setChats(list);
      setPage(meta.currentPage || pageNum);
      setTotalCount(meta.totalItems ?? list.length);
    } catch {
      toast.error("خطا در دریافت لیست چت‌ها");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (chatId: string) => {
    setLoadingLogs(true);
    try {
      const { data } = await api.get(`/telegram-automation/chats/${chatId}/logs`);
      setLogs(data?.data || data || []);
    } catch {
      toast.error("خطا در دریافت گزارش‌های هوش مصنوعی");
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleTabChange = (tab: "chat" | "logs") => {
    setActiveTab(tab);
    if (tab === "logs" && logs.length === 0 && selectedChat) fetchLogs(selectedChat.id);
  };

  useEffect(() => { fetchChats(page); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, limit]);

  const handleViewHistory = async (chat: ChatType) => {
    setSelectedChat(chat);
    setActiveTab("chat");
    setLogs([]);
    setExpandedLogId(null);
    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/telegram-automation/chats/${chat.id}/messages`);
      setMessages(data?.data || data || []);
      setTimeout(() => {
        if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }, 100);
    } catch {
      toast.error("خطا در دریافت تاریخچه پیام‌ها");
    } finally {
      setLoadingMessages(false);
    }
  };

  const applyChatUpdate = (updated: ChatType) => {
    setChats((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    setSelectedChat((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
  };

  const handlePause = async (chat: ChatType) => {
    setActionLoading({ id: chat.id, action: "pause" });
    try {
      const { data } = await api.patch(`/telegram-automation/chats/${chat.id}/pause`, { hours: 5 });
      applyChatUpdate(data?.data || data);
      toast.success("پاسخ خودکار برای ۵ ساعت متوقف شد");
    } catch { toast.error("خطا در توقف موقت"); } finally { setActionLoading(null); }
  };

  const handleDisable = async (chat: ChatType) => {
    setActionLoading({ id: chat.id, action: "disable" });
    try {
      const { data } = await api.patch(`/telegram-automation/chats/${chat.id}/disable`);
      applyChatUpdate(data?.data || data);
      toast.success("پاسخ خودکار برای این گفتگو به‌طور دائم غیرفعال شد");
    } catch { toast.error("خطا در غیرفعال‌سازی"); } finally { setActionLoading(null); }
  };

  const handleResume = async (chat: ChatType) => {
    setActionLoading({ id: chat.id, action: "resume" });
    try {
      const { data } = await api.patch(`/telegram-automation/chats/${chat.id}/resume`);
      applyChatUpdate(data?.data || data);
      toast.success("پاسخ خودکار دوباره فعال شد");
    } catch { toast.error("خطا در فعال‌سازی مجدد"); } finally { setActionLoading(null); }
  };

  const columns: ColumnDef<ChatType>[] = [
    {
      id: "user",
      header: "کاربر",
      cell: ({ row }) => {
        const chat = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-sm">
              {chat.firstName ? chat.firstName.charAt(0) : "U"}
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">
                {[chat.firstName, chat.lastName].filter(Boolean).join(" ") || "کاربر ناشناس"}
              </div>
              <div className="text-xs text-slate-400">
                {chat.username ? `@${chat.username}` : "بدون نام کاربری"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "telegramId",
      header: "شناسه تلگرام",
      cell: ({ row }) => (
        <span className="font-mono text-xs select-all text-slate-700">{row.original.telegramId}</span>
      ),
    },
    {
      id: "status",
      header: "وضعیت",
      cell: ({ row }) => <StatusBadge chat={row.original} />,
    },
    {
      id: "tokens",
      header: "توکن ورودی / خروجی",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600">
          {row.original.totalTokensIn.toLocaleString()} / {row.original.totalTokensOut.toLocaleString()}
        </span>
      ),
    },
    {
      id: "cost",
      header: "هزینه کل (دلار)",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          ${row.original.totalMoneySpent.toFixed(5)}
        </span>
      ),
    },
    {
      id: "costIrt",
      header: "هزینه کل (تومان)",
      cell: ({ row }) => {
        if (!usdToIrtRate) return <span className="text-xs text-slate-400">—</span>;
        const irt = row.original.totalMoneySpent * usdToIrtRate;
        return (
          <span className="font-mono text-xs font-bold text-emerald-700">
            {Math.round(irt).toLocaleString("fa-IR")} ت
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "عملیات",
      cell: ({ row }) => {
        const chat = row.original;
        return (
          <Button variant="outline" size="sm" onClick={() => handleViewHistory(chat)} type="button">
            <MessageSquare className="h-3.5 w-3.5" />
            مشاهده گفتگو
          </Button>
        );
      },
    },
    {
      id: "controls",
      header: "کنترل پاسخ خودکار",
      cell: ({ row }) => {
        const chat = row.original;
        const busy = actionLoading?.id === chat.id;
        const isPaused = chat.status === "sleep";
        const isDisabled = chat.status === "disabled";
        return (
          <div className="flex items-center justify-center gap-1">
            {(isPaused || isDisabled) && (
              <button onClick={() => handleResume(chat)} disabled={busy} title="فعال‌سازی مجدد" type="button"
                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 cursor-pointer">
                <PlayCircle className="h-4 w-4" />
              </button>
            )}
            {!isDisabled && (
              <button onClick={() => handlePause(chat)} disabled={busy} title="توقف ۵ ساعته" type="button"
                className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50 cursor-pointer">
                <PauseCircle className="h-4 w-4" />
              </button>
            )}
            {!isDisabled && (
              <button onClick={() => handleDisable(chat)} disabled={busy} title="غیرفعال دائمی" type="button"
                className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer">
                <Ban className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <LayoutTable isRefetching={loading && chats.length > 0}>
        <div className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-base font-bold text-slate-800">تاریخچه گفتگوها (PV)</h1>
              <p className="text-xs text-slate-400">لیست کامل گفتگوهای اتوماسیون تلگرام با تفکیک هزینه‌ها.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">نرخ دلار (تومان):</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={irtRateInput}
                  onChange={(e) => setIrtRateInput(e.target.value)}
                  onBlur={handleIrtRateSave}
                  onKeyDown={(e) => e.key === "Enter" && handleIrtRateSave()}
                  placeholder="مثلاً ۹۵۰۰۰"
                  className="w-28 bg-transparent text-xs font-mono text-slate-700 outline-none placeholder:text-slate-300 text-right"
                />
                {irtRateSaving && <RefreshCw className="h-3 w-3 text-slate-400 animate-spin" />}
                {irtRateSaved && <Check className="h-3 w-3 text-emerald-500" />}
              </div>
              <button onClick={() => fetchChats(page)} type="button"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-600 shadow-xs hover:bg-slate-50 cursor-pointer">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={chats}
            page={page}
            limit={limit}
            totalCount={totalCount}
            onPageChange={setPage}
            onLimitChange={setLimit}
            tableInstanceRef={setTableInstance}
          />

          {tableInstance && (
            <DataTablePagination table={tableInstance} totalCount={totalCount} />
          )}
        </div>
      </LayoutTable>

      {/* Chat history / logs drawer */}
      {selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
          <div className="h-full w-full max-w-xl bg-slate-50 shadow-2xl flex flex-col relative border-r border-slate-200">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {selectedChat.firstName ? selectedChat.firstName.charAt(0) : "U"}
                </div>
                <div>
                  <div className="font-bold text-slate-800">
                    {[selectedChat.firstName, selectedChat.lastName].filter(Boolean).join(" ") || "کاربر ناشناس"}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>شناسه: {selectedChat.telegramId}</span>
                    <span>•</span>
                    <span>مجموع هزینه: ${selectedChat.totalMoneySpent.toFixed(4)}</span>
                    {usdToIrtRate && (
                      <>
                        <span>≈</span>
                        <span className="text-emerald-600 font-medium">
                          {Math.round(selectedChat.totalMoneySpent * usdToIrtRate).toLocaleString("fa-IR")} تومان
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => { setSelectedChat(null); setMessages([]); setLogs([]); }} type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Admin AI controls */}
            <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-2 shrink-0 flex-wrap">
              <span className="text-[11px] font-medium text-slate-500">وضعیت پاسخ خودکار:</span>
              <StatusBadge chat={selectedChat} />
              <div className="flex items-center gap-1.5 mr-auto">
                {selectedChat.status !== "active" && selectedChat.status !== "responding" && (
                  <button onClick={() => handleResume(selectedChat)} disabled={actionLoading?.id === selectedChat.id} type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer">
                    <PlayCircle className="h-3.5 w-3.5" />
                    {actionLoading?.id === selectedChat.id && actionLoading.action === "resume" ? "..." : "فعال‌سازی مجدد"}
                  </button>
                )}
                {selectedChat.status !== "disabled" && (
                  <button onClick={() => handlePause(selectedChat)} disabled={actionLoading?.id === selectedChat.id} type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer">
                    <PauseCircle className="h-3.5 w-3.5" />
                    {actionLoading?.id === selectedChat.id && actionLoading.action === "pause" ? "..." : "توقف ۵ ساعته"}
                  </button>
                )}
                {selectedChat.status !== "disabled" && (
                  <button onClick={() => handleDisable(selectedChat)} disabled={actionLoading?.id === selectedChat.id} type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer">
                    <Ban className="h-3.5 w-3.5" />
                    {actionLoading?.id === selectedChat.id && actionLoading.action === "disable" ? "..." : "غیرفعال دائمی"}
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-slate-200 px-4 flex gap-6 shrink-0 text-xs font-bold">
              <button onClick={() => handleTabChange("chat")} type="button"
                className={`py-3.5 border-b-2 transition-all cursor-pointer ${activeTab === "chat" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                تاریخچه گفتگوها
              </button>
              <button onClick={() => handleTabChange("logs")} type="button"
                className={`py-3.5 border-b-2 transition-all cursor-pointer ${activeTab === "logs" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                گزارش‌های هوش مصنوعی (Logs)
              </button>
            </div>

            {activeTab === "chat" ? (
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 leading-normal"
                style={{ backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-sm text-slate-500">در حال بارگذاری گفتگو...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2 py-20">
                    <MessageSquare className="h-8 w-8 text-slate-300" />
                    <span className="text-xs">هیچ پیامی در این گفتگو وجود ندارد</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div key={msg.id} className={`flex w-full ${isUser ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs relative leading-relaxed ${isUser ? "bg-white text-slate-800 border border-slate-200 rounded-br-none" : "bg-blue-600 text-white rounded-bl-none"}`}>
                          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold opacity-85">
                            {isUser ? (<><UserIcon className="h-3 w-3 shrink-0" /><span>{selectedChat.firstName || "کاربر"}</span></>) : (<><Bot className="h-3 w-3 shrink-0" /><span>دستیار هوش مصنوعی</span></>)}
                          </div>
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                          {!isUser && (msg.tokensIn > 0 || msg.tokensOut > 0) && (
                            <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-white/20 pt-1.5 text-[9px] font-mono opacity-80">
                              <Cpu className="h-2.5 w-2.5" />
                              <span>In: {msg.tokensIn}</span><span>•</span>
                              <span>Out: {msg.tokensOut}</span><span>•</span>
                              <span>${msg.moneySpent.toFixed(5)}</span>
                            </div>
                          )}
                          <div className={`mt-2 text-[8px] font-mono ${isUser ? "text-left text-slate-400" : "text-right text-blue-200"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-[11px] text-slate-500">لیست ۵۰ لاگ اخیر ارتباط با هوش مصنوعی</span>
                  <button onClick={() => fetchLogs(selectedChat.id)} type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer">
                    <RefreshCw className="h-3 w-3" />
                    بروزرسانی لاگ‌ها
                  </button>
                </div>

                {loadingLogs ? (
                  <div className="flex h-full items-center justify-center py-20">
                    <span className="text-sm text-slate-500">در حال بارگذاری تراکنش‌ها...</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2 py-20">
                    <Cpu className="h-8 w-8 text-slate-300 animate-pulse" />
                    <span className="text-xs">هیچ گزارشی ثبت نشده است</span>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {logs.map((log) => {
                      const isSuccess = log.statusCode === 200;
                      const isOpen = expandedLogId === log.id;
                      let parsedRequest: { system?: string; messages?: Array<{ role: string; content: string }> } = {};
                      try { parsedRequest = JSON.parse(log.requestPayload); } catch { parsedRequest = {}; }
                      let parsedResponse: { text?: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } } | null = null;
                      try { parsedResponse = JSON.parse(log.responsePayload); } catch { /* plain text */ }

                      return (
                        <div key={log.id} className="rounded-xl border border-slate-100 bg-white shadow-xs overflow-hidden">
                          <div onClick={() => setExpandedLogId(isOpen ? null : log.id)}
                            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors select-none">
                            <div className="flex items-center gap-2.5">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isSuccess ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                                {log.statusCode} {isSuccess ? "موفق" : "خطا"}
                              </span>
                              <div className="flex flex-col gap-0.5">
                                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 font-mono">
                                  <span>{log.provider}</span><span className="text-slate-400">•</span><span className="text-slate-500">{log.model}</span>
                                </div>
                                <div className="text-[9px] text-slate-400">
                                  {new Date(log.createdAt).toLocaleDateString("fa-IR")} - {new Date(log.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                </div>
                              </div>
                            </div>
                            {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                          </div>

                          {isOpen && (
                            <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50 text-xs">
                              <div className="space-y-2">
                                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                                  <Terminal className="h-3.5 w-3.5 text-slate-400" />
                                  <span>درخواست ارسالی (Request Payload)</span>
                                </div>
                                <div className="space-y-1 pl-1">
                                  <span className="text-[10px] font-medium text-slate-500">دستور سیستم (System Prompt):</span>
                                  <pre className="p-2.5 bg-slate-100/80 rounded-lg font-mono text-[9px] whitespace-pre-wrap select-all text-slate-700 max-h-32 overflow-y-auto border border-slate-200/30">
                                    {parsedRequest.system || "پرامپت خالی"}
                                  </pre>
                                </div>
                                <div className="space-y-1 pl-1 mt-2">
                                  <span className="text-[10px] font-medium text-slate-500">پیام‌های ارسال شده در کانتکست:</span>
                                  <div className="bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/30 max-h-40 overflow-y-auto space-y-1.5">
                                    {parsedRequest.messages && parsedRequest.messages.length > 0 ? (
                                      parsedRequest.messages.map((m, idx) => (
                                        <div key={idx} className="text-[9px] border-b border-slate-200/20 pb-1 last:border-b-0 last:pb-0">
                                          <span className={`font-bold ${m.role === "user" ? "text-blue-600" : "text-purple-600"}`}>
                                            {m.role === "user" ? "User: " : "Assistant: "}
                                          </span>
                                          <span className="font-mono text-slate-700 select-all">{m.content}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-[9px] text-slate-400">بدون تاریخچه قبلی</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 border-t border-slate-200/50 pt-3">
                                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                                  <Cpu className="h-3.5 w-3.5 text-slate-400" />
                                  <span>پاسخ دریافتی (Response Payload)</span>
                                </div>
                                {isSuccess ? (
                                  <div className="space-y-2">
                                    <pre className="p-3 bg-emerald-50/20 rounded-lg font-mono text-[10px] whitespace-pre-wrap select-all text-emerald-800 border border-emerald-100/50">
                                      {parsedResponse?.text || log.responsePayload}
                                    </pre>
                                    {parsedResponse?.usage && (
                                      <div className="flex flex-wrap gap-2 text-[9px] font-mono text-slate-500 bg-slate-100 p-2 rounded-lg border border-slate-200/10">
                                        <span>توکن ورودی: {parsedResponse.usage.promptTokens}</span>
                                        <span>•</span>
                                        <span>توکن خروجی: {parsedResponse.usage.completionTokens}</span>
                                        <span>•</span>
                                        <span>توکن کل: {parsedResponse.usage.totalTokens || (parsedResponse.usage.promptTokens + parsedResponse.usage.completionTokens)}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-2.5">
                                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-800">
                                      <div className="text-[10px] font-bold flex items-center gap-1.5 mb-1">
                                        <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                                        خطا در فراخوانی هوش مصنوعی
                                      </div>
                                      <p className="text-[10px] font-mono select-all leading-normal whitespace-pre-wrap">{log.errorMessage}</p>
                                    </div>
                                    {log.responsePayload && (
                                      <div className="space-y-1 pl-1">
                                        <span className="text-[9px] font-bold text-slate-500">کد رهگیری / Traceback:</span>
                                        <pre className="p-2.5 bg-slate-900 rounded-lg font-mono text-[8px] text-rose-300 whitespace-pre-wrap select-all overflow-x-auto max-h-40 overflow-y-auto border border-rose-950/20">
                                          {log.responsePayload}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
