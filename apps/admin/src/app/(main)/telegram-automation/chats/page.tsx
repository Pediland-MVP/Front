"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/hooks/swr/api-client";
import { toast } from "sonner";
import { MessageSquare, RefreshCw, X, User as UserIcon, Bot, Cpu, ChevronDown, ChevronUp, AlertCircle, Terminal, PauseCircle, Ban, PlayCircle } from "lucide-react";

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

export default function ChatsPage() {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  // Message details modal state
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // AI Agent logs state
  const [activeTab, setActiveTab] = useState<"chat" | "logs">("chat");
  const [logs, setLogs] = useState<LogType[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Admin control actions (pause / disable / resume) — tracked per chat id
  const [actionLoading, setActionLoading] = useState<{ id: string; action: "pause" | "disable" | "resume" } | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch chats list
  const fetchChats = async (pageNum: number) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/telegram-automation/chats?page=${pageNum}&limit=${limit}`);
      const responsePayload = data?.data || data || {};
      const list = responsePayload.items || [];
      const meta = responsePayload.meta || {};
      setChats(list);
      setPage(meta.currentPage || pageNum);
      setTotalPages(meta.totalPages || 1);
    } catch {
      toast.error("خطا در دریافت لیست چت‌ها");
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI Agent transaction logs
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
    if (tab === "logs" && logs.length === 0 && selectedChat) {
      fetchLogs(selectedChat.id);
    }
  };

  useEffect(() => {
    fetchChats(page);
  }, [page]);

  // Open message history overlay
  const handleViewHistory = async (chat: ChatType) => {
    setSelectedChat(chat);
    setActiveTab("chat");
    setLogs([]);
    setExpandedLogId(null);
    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/telegram-automation/chats/${chat.id}/messages`);
      setMessages(data?.data || data || []);
      // Scroll to bottom after loading messages
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch {
      toast.error("خطا در دریافت تاریخچه پیام‌ها");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Format remaining pause time (e.g. "۴ ساعت", "۱۲ دقیقه")
  const formatRemaining = (until: string | null): string => {
    if (!until) return "";
    const ms = new Date(until).getTime() - Date.now();
    if (ms <= 0) return "";
    const mins = Math.round(ms / 60000);
    if (mins >= 60) return `${Math.round(mins / 60)} ساعت`;
    return `${mins} دقیقه`;
  };

  // Apply a status change locally so both the table and the open drawer update
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
    } catch {
      toast.error("خطا در توقف موقت");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisable = async (chat: ChatType) => {
    setActionLoading({ id: chat.id, action: "disable" });
    try {
      const { data } = await api.patch(`/telegram-automation/chats/${chat.id}/disable`);
      applyChatUpdate(data?.data || data);
      toast.success("پاسخ خودکار برای این گفتگو به‌طور دائم غیرفعال شد");
    } catch {
      toast.error("خطا در غیرفعال‌سازی");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (chat: ChatType) => {
    setActionLoading({ id: chat.id, action: "resume" });
    try {
      const { data } = await api.patch(`/telegram-automation/chats/${chat.id}/resume`);
      applyChatUpdate(data?.data || data);
      toast.success("پاسخ خودکار دوباره فعال شد");
    } catch {
      toast.error("خطا در فعال‌سازی مجدد");
    } finally {
      setActionLoading(null);
    }
  };

  // Compact icon-only control buttons for a chat (used in the table rows)
  const renderRowControls = (chat: ChatType) => {
    const busy = actionLoading?.id === chat.id;
    const isPaused = chat.status === "sleep";
    const isDisabled = chat.status === "disabled";
    return (
      <div className="flex items-center justify-center gap-1">
        {(isPaused || isDisabled) && (
          <button
            onClick={() => handleResume(chat)}
            disabled={busy}
            title="فعال‌سازی مجدد"
            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20 cursor-pointer"
            type="button"
          >
            <PlayCircle className="h-4 w-4" />
          </button>
        )}
        {!isDisabled && (
          <button
            onClick={() => handlePause(chat)}
            disabled={busy}
            title="توقف ۵ ساعته"
            className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-950/20 cursor-pointer"
            type="button"
          >
            <PauseCircle className="h-4 w-4" />
          </button>
        )}
        {!isDisabled && (
          <button
            onClick={() => handleDisable(chat)}
            disabled={busy}
            title="غیرفعال دائمی"
            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/20 cursor-pointer"
            type="button"
          >
            <Ban className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };

  const getStatusBadge = (chat: ChatType) => {
    if (chat.status === "responding") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">
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
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">
          <Ban className="h-3 w-3" />
          غیرفعال دائمی
        </span>
      );
    }
    if (chat.status === "sleep") {
      const remaining = formatRemaining(chat.sleepUntil);
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          {remaining ? `متوقف (${remaining} دیگر)` : "متوقف"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        فعال
      </span>
    );
  };

  const buttonSecondary =
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer";

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              تاریخچه گفتگوها (PV)
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              لیست کامل گفتگوهای اتوماسیون تلگرام با تفکیک هزینه‌ها و ابزارهای هوش مصنوعی استفاده شده.
            </p>
          </div>
          <button
            onClick={() => fetchChats(page)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-2.5 text-sm text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Chats Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-700 dark:bg-gray-800/40 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-4">کاربر</th>
                  <th scope="col" className="px-6 py-4">شناسه تلگرام</th>
                  <th scope="col" className="px-6 py-4 text-center">وضعیت</th>
                  <th scope="col" className="px-6 py-4 text-center">توکن ورودی / خروجی</th>
                  <th scope="col" className="px-6 py-4 text-center">هزینه کل (دلار)</th>
                  <th scope="col" className="px-6 py-4 text-center">عملیات</th>
                  <th scope="col" className="px-6 py-4 text-center">کنترل پاسخ خودکار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                      در حال بارگذاری...
                    </td>
                  </tr>
                ) : chats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                      هیچ گفتگویی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  chats.map((chat) => (
                    <tr key={chat.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold text-sm">
                            {chat.firstName ? chat.firstName.charAt(0) : "U"}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">
                              {[chat.firstName, chat.lastName].filter(Boolean).join(" ") || "کاربر ناشناس"}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {chat.username ? `@${chat.username}` : "بدون نام کاربری"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs select-all text-gray-900 dark:text-gray-100">{chat.telegramId}</td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(chat)}</td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-gray-700 dark:text-gray-300">
                        {chat.totalTokensIn.toLocaleString()} / {chat.totalTokensOut.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs font-bold text-gray-900 dark:text-gray-100">
                        ${chat.totalMoneySpent.toFixed(5)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewHistory(chat)}
                          className={buttonSecondary}
                          type="button"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          مشاهده گفتگو
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">{renderRowControls(chat)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-6 py-4 bg-gray-50/30 dark:bg-gray-900/10">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 disabled:opacity-50 dark:border-gray-700 cursor-pointer"
              >
                قبلی
              </button>
              <span className="text-xs text-gray-500">
                صفحه {page} از {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 disabled:opacity-50 dark:border-gray-700 cursor-pointer"
              >
                بعدی
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp/Telegram Style Drawer Overlay for Chat History */}
      {selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300">
          <div className="h-full w-full max-w-xl bg-gray-100 dark:bg-gray-950 shadow-2xl flex flex-col relative animate-slide-left border-r border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-center font-bold">
                  {selectedChat.firstName ? selectedChat.firstName.charAt(0) : "U"}
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-gray-100">
                    {[selectedChat.firstName, selectedChat.lastName].filter(Boolean).join(" ") || "کاربر ناشناس"}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
                    <span>شناسه: {selectedChat.telegramId}</span>
                    <span>•</span>
                    <span>مجموع هزینه: ${selectedChat.totalMoneySpent.toFixed(4)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedChat(null);
                  setMessages([]);
                  setLogs([]);
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Admin AI controls */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2.5 flex items-center gap-2 shrink-0 flex-wrap">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">وضعیت پاسخ خودکار:</span>
              {getStatusBadge(selectedChat)}
              <div className="flex items-center gap-1.5 mr-auto">
                {selectedChat.status !== "active" && selectedChat.status !== "responding" && (
                  <button
                    onClick={() => handleResume(selectedChat)}
                    disabled={actionLoading?.id === selectedChat.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 cursor-pointer"
                    type="button"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    {actionLoading?.id === selectedChat.id && actionLoading.action === "resume" ? "..." : "فعال‌سازی مجدد"}
                  </button>
                )}
                {selectedChat.status !== "disabled" && (
                  <button
                    onClick={() => handlePause(selectedChat)}
                    disabled={actionLoading?.id === selectedChat.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300 cursor-pointer"
                    type="button"
                  >
                    <PauseCircle className="h-3.5 w-3.5" />
                    {actionLoading?.id === selectedChat.id && actionLoading.action === "pause" ? "..." : "توقف ۵ ساعته"}
                  </button>
                )}
                {selectedChat.status !== "disabled" && (
                  <button
                    onClick={() => handleDisable(selectedChat)}
                    disabled={actionLoading?.id === selectedChat.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-300 cursor-pointer"
                    type="button"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    {actionLoading?.id === selectedChat.id && actionLoading.action === "disable" ? "..." : "غیرفعال دائمی"}
                  </button>
                )}
              </div>
            </div>

            {/* Premium Persian Tabs Switcher */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 flex gap-6 shrink-0 text-xs font-bold">
              <button
                onClick={() => handleTabChange("chat")}
                className={`py-3.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === "chat"
                    ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                تاریخچه گفتگوها
              </button>
              <button
                onClick={() => handleTabChange("logs")}
                className={`py-3.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === "logs"
                    ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                گزارش‌های هوش مصنوعی (Logs)
              </button>
            </div>

            {/* Content Switcher */}
            {activeTab === "chat" ? (
              /* Message Bubble Layout */
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950 leading-normal"
                style={{
                  backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
                  backgroundSize: "20px 20px"
                }}
              >
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-sm text-gray-500">در حال بارگذاری گفتگو...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-gray-400 gap-2 py-20">
                    <MessageSquare className="h-8 w-8 text-gray-300" />
                    <span className="text-xs">هیچ پیامی در این گفتگو وجود ندارد</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`flex w-full ${isUser ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs relative leading-relaxed ${
                            isUser
                              ? "bg-white text-gray-900 border border-gray-200 rounded-br-none dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800"
                              : "bg-blue-600 text-white rounded-bl-none dark:bg-blue-600"
                          }`}
                        >
                          {/* Sender Label */}
                          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold opacity-85">
                            {isUser ? (
                              <>
                                <UserIcon className="h-3 w-3 shrink-0" />
                                <span>{selectedChat.firstName || "کاربر"}</span>
                              </>
                            ) : (
                              <>
                                <Bot className="h-3 w-3 shrink-0" />
                                <span>دستیار هوش مصنوعی</span>
                              </>
                            )}
                          </div>

                          {/* Content */}
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                          {/* Metrics footer inside bubble */}
                          {!isUser && (msg.tokensIn > 0 || msg.tokensOut > 0) && (
                            <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-white/20 pt-1.5 text-[9px] font-mono opacity-80">
                              <Cpu className="h-2.5 w-2.5" />
                              <span>In: {msg.tokensIn}</span>
                              <span>•</span>
                              <span>Out: {msg.tokensOut}</span>
                              <span>•</span>
                              <span>${msg.moneySpent.toFixed(5)}</span>
                            </div>
                          )}
                          
                          {isUser && (
                            <div className="mt-2 text-left text-[8px] text-gray-400 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          )}
                          
                          {!isUser && (
                            <div className="mt-2 text-right text-[8px] text-blue-200 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Transaction Logs Layout */
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
                <div className="flex items-center justify-between border-b border-gray-250 pb-3 dark:border-gray-800">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    لیست ۵۰ لاگ اخیر ارتباط با هوش مصنوعی برای خطا یابی و آنالیز خطاها
                  </span>
                  <button
                    onClick={() => fetchLogs(selectedChat.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                    type="button"
                  >
                    <RefreshCw className="h-3 w-3" />
                    بروزرسانی لاگ‌ها
                  </button>
                </div>

                {loadingLogs ? (
                  <div className="flex h-full items-center justify-center py-20">
                    <span className="text-sm text-gray-500">در حال بارگذاری تراکنش‌ها...</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-gray-400 gap-2 py-20">
                    <Cpu className="h-8 w-8 text-gray-300 animate-pulse" />
                    <span className="text-xs">هیچ گزارشی از تراکنش‌های هوش مصنوعی ثبت نشده است</span>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {logs.map((log) => {
                      const isSuccess = log.statusCode === 200;
                      const isOpen = expandedLogId === log.id;

                      let parsedRequest: { system?: string; messages?: Array<{ role: string; content: string }> } = {};
                      try {
                        parsedRequest = JSON.parse(log.requestPayload);
                      } catch {
                        parsedRequest = {};
                      }

                      let parsedResponse: { text?: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } } | null = null;
                      try {
                        parsedResponse = JSON.parse(log.responsePayload);
                      } catch {
                        // Not JSON, probably plain text error/stack trace
                      }

                      return (
                        <div
                          key={log.id}
                          className="rounded-xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden transition-all duration-200"
                        >
                          {/* Card Header */}
                          <div
                            onClick={() => setExpandedLogId(isOpen ? null : log.id)}
                            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isSuccess
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                                    : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                                }`}
                              >
                                {log.statusCode} {isSuccess ? "موفق" : "خطا"}
                              </span>
                              <div className="flex flex-col gap-0.5">
                                <div className="text-[11px] font-bold text-gray-850 dark:text-gray-100 flex items-center gap-1.5 font-mono">
                                  <span>{log.provider}</span>
                                  <span className="text-gray-400 dark:text-gray-600">•</span>
                                  <span className="text-gray-500 dark:text-gray-400">{log.model}</span>
                                </div>
                                <div className="text-[9px] text-gray-400 dark:text-gray-500">
                                  {new Date(log.createdAt).toLocaleDateString("fa-IR")} -{" "}
                                  {new Date(log.createdAt).toLocaleTimeString("fa-IR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                            <div>
                              {isOpen ? (
                                <ChevronUp className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>

                          {/* Card Body (Collapsible) */}
                          {isOpen && (
                            <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/30 text-xs">
                              {/* Request Payload */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-1 text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                  <Terminal className="h-3.5 w-3.5 text-gray-400" />
                                  <span>درخواست ارسالی (Request Payload)</span>
                                </div>
                                
                                {/* System Prompt */}
                                <div className="space-y-1 pl-1">
                                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">دستور سیستم (System Prompt):</span>
                                  <pre className="p-2.5 bg-gray-100/80 rounded-lg font-mono text-[9px] whitespace-pre-wrap select-all text-gray-800 dark:bg-gray-950 dark:text-gray-200 max-h-32 overflow-y-auto border border-gray-200/30 dark:border-gray-800/30">
                                    {parsedRequest.system || "پرامپت خالی"}
                                  </pre>
                                </div>

                                {/* History Messages */}
                                <div className="space-y-1 pl-1 mt-2">
                                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">پیام‌های ارسال شده در کانتکست (Messages):</span>
                                  <div className="bg-gray-100/80 p-2.5 rounded-lg dark:bg-gray-950 border border-gray-200/30 dark:border-gray-800/30 max-h-40 overflow-y-auto space-y-1.5">
                                    {parsedRequest.messages && parsedRequest.messages.length > 0 ? (
                                      parsedRequest.messages.map((m, idx) => (
                                        <div key={idx} className="text-[9px] border-b border-gray-200/20 dark:border-gray-800/20 pb-1 last:border-b-0 last:pb-0">
                                          <span className={`font-bold ${m.role === 'user' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`}>
                                            {m.role === 'user' ? 'User: ' : 'Assistant: '}
                                          </span>
                                          <span className="font-mono text-gray-800 dark:text-gray-200 select-all">{m.content}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-[9px] text-gray-400">بدون تاریخچه قبلی</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Response Payload */}
                              <div className="space-y-2 border-t border-gray-200/50 dark:border-gray-800/50 pt-3">
                                <div className="flex items-center gap-1 text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                  <Cpu className="h-3.5 w-3.5 text-gray-400" />
                                  <span>پاسخ دریافتی (Response Payload)</span>
                                </div>

                                {isSuccess ? (
                                  <div className="space-y-2">
                                    <div className="space-y-1 pl-1">
                                      <pre className="p-3 bg-emerald-50/20 rounded-lg font-mono text-[10px] whitespace-pre-wrap select-all text-emerald-800 dark:bg-emerald-950/5 dark:text-emerald-300 border border-emerald-100/50 dark:border-emerald-900/10">
                                        {parsedResponse?.text || log.responsePayload}
                                      </pre>
                                    </div>
                                    
                                    {parsedResponse?.usage && (
                                      <div className="flex flex-wrap gap-2 text-[9px] font-mono text-gray-500 dark:text-gray-400 bg-gray-150 p-2 rounded-lg dark:bg-gray-950 border border-gray-200/10 dark:border-gray-800/20">
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
                                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 dark:bg-rose-950/10 dark:border-rose-900/20 dark:text-rose-400">
                                      <div className="text-[10px] font-bold flex items-center gap-1.5 mb-1">
                                        <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                                        خطا در فراخوانی هوش مصنوعی
                                      </div>
                                      <p className="text-[10px] font-mono select-all leading-normal whitespace-pre-wrap">{log.errorMessage}</p>
                                    </div>
                                    
                                    {log.responsePayload && (
                                      <div className="space-y-1 pl-1">
                                        <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">کد رهگیری / Traceback:</span>
                                        <pre className="p-2.5 bg-gray-900 rounded-lg font-mono text-[8px] text-rose-300 whitespace-pre-wrap select-all overflow-x-auto max-h-40 overflow-y-auto border border-rose-950/20">
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
    </div>
  );
}
