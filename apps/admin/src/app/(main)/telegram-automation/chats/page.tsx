'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/hooks/swr/api-client';
import { toast } from 'sonner';
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
} from 'lucide-react';
import { ColumnDef, Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { onInputP2EHandler } from '@/lib/p2eNumber';
import { LayoutTable } from '@/components/layout/LayoutTable';
import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/pagination';

interface ChatType {
  id: string;
  telegramId: string;
  firstName: string;
  lastName: string;
  username: string;
  status: 'active' | 'sleep' | 'responding' | 'disabled';
  sleepUntil: string | null;
  totalTokensIn: number;
  totalTokensOut: number;
  totalMoneySpent: number;
  createdAt: string;
  updatedAt: string;
}

interface MessageType {
  id: string;
  role: 'user' | 'assistant' | 'system';
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
  if (!until) return '';
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return '';
  const mins = Math.round(ms / 60000);
  if (mins >= 60) return `${Math.round(mins / 60)} ساعت`;
  return `${mins} دقیقه`;
};

function StatusBadge({ chat }: { chat: ChatType }) {
  if (chat.status === 'responding') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        <span className="flex gap-0.5">
          <span
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500"
            style={{ animationDelay: '300ms' }}
          />
        </span>
        در حال پاسخ‌دهی...
      </span>
    );
  }
  if (chat.status === 'disabled') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
        <Ban className="h-3 w-3" />
        غیرفعال دائمی
      </span>
    );
  }
  if (chat.status === 'sleep') {
    const remaining = formatRemaining(chat.sleepUntil);
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        {remaining ? `متوقف (${remaining} دیگر)` : 'متوقف'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
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
  const [irtRateInput, setIrtRateInput] = useState('');
  const [irtRateSaving, setIrtRateSaving] = useState(false);
  const [irtRateSaved, setIrtRateSaved] = useState(false);

  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [activeTab, setActiveTab] = useState<'chat' | 'logs'>('chat');
  const [logs, setLogs] = useState<LogType[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<{
    id: string;
    action: 'pause' | 'disable' | 'resume';
  } | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get('/telegram-automation/settings')
      .then(({ data }) => {
        const rate = data?.data?.usdToIrtRate ?? data?.usdToIrtRate ?? null;
        if (rate) {
          setUsdToIrtRate(rate);
          setIrtRateInput(String(rate));
        }
      })
      .catch(() => {});
  }, []);

  const handleIrtRateSave = async () => {
    const val = Number(irtRateInput.replace(/,/g, ''));
    if (!val || isNaN(val) || val <= 0) return;
    setIrtRateSaving(true);
    try {
      await api.patch('/telegram-automation/settings/usd-irt-rate', { usdToIrtRate: val });
      setUsdToIrtRate(val);
      setIrtRateSaved(true);
      setTimeout(() => setIrtRateSaved(false), 2000);
    } catch {
      toast.error('خطا در ذخیره نرخ دلار');
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
      toast.error('خطا در دریافت لیست چت‌ها');
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
      toast.error('خطا در دریافت گزارش‌های هوش مصنوعی');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleTabChange = (tab: 'chat' | 'logs') => {
    setActiveTab(tab);
    if (tab === 'logs' && logs.length === 0 && selectedChat) fetchLogs(selectedChat.id);
  };

  useEffect(() => {
    fetchChats(page); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [page, limit]);

  const handleViewHistory = async (chat: ChatType) => {
    setSelectedChat(chat);
    setActiveTab('chat');
    setLogs([]);
    setExpandedLogId(null);
    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/telegram-automation/chats/${chat.id}/messages`);
      setMessages(data?.data || data || []);
      setTimeout(() => {
        if (chatContainerRef.current)
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }, 100);
    } catch {
      toast.error('خطا در دریافت تاریخچه پیام‌ها');
    } finally {
      setLoadingMessages(false);
    }
  };

  const applyChatUpdate = (updated: ChatType) => {
    setChats((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    setSelectedChat((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
  };

  const handlePause = async (chat: ChatType) => {
    setActionLoading({ id: chat.id, action: 'pause' });
    try {
      const { data } = await api.patch(`/telegram-automation/chats/${chat.id}/pause`, { hours: 5 });
      applyChatUpdate(data?.data || data);
      toast.success('پاسخ خودکار برای ۵ ساعت متوقف شد');
    } catch {
      toast.error('خطا در توقف موقت');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisable = async (chat: ChatType) => {
    setActionLoading({ id: chat.id, action: 'disable' });
    try {
      const { data } = await api.patch(`/telegram-automation/chats/${chat.id}/disable`);
      applyChatUpdate(data?.data || data);
      toast.success('پاسخ خودکار برای این گفتگو به‌طور دائم غیرفعال شد');
    } catch {
      toast.error('خطا در غیرفعال‌سازی');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (chat: ChatType) => {
    setActionLoading({ id: chat.id, action: 'resume' });
    try {
      const { data } = await api.patch(`/telegram-automation/chats/${chat.id}/resume`);
      applyChatUpdate(data?.data || data);
      toast.success('پاسخ خودکار دوباره فعال شد');
    } catch {
      toast.error('خطا در فعال‌سازی مجدد');
    } finally {
      setActionLoading(null);
    }
  };

  const columns: ColumnDef<ChatType>[] = [
    {
      id: 'user',
      header: 'کاربر',
      cell: ({ row }) => {
        const chat = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
              {chat.firstName ? chat.firstName.charAt(0) : 'U'}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                {[chat.firstName, chat.lastName].filter(Boolean).join(' ') || 'کاربر ناشناس'}
              </div>
              <div className="text-xs text-slate-400">
                {chat.username ? `@${chat.username}` : 'بدون نام کاربری'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'telegramId',
      header: 'شناسه تلگرام',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-700 select-all">
          {row.original.telegramId}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'وضعیت',
      cell: ({ row }) => <StatusBadge chat={row.original} />,
    },
    {
      id: 'tokens',
      header: 'توکن ورودی / خروجی',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600">
          {row.original.totalTokensIn.toLocaleString()} /{' '}
          {row.original.totalTokensOut.toLocaleString()}
        </span>
      ),
    },
    {
      id: 'cost',
      header: 'هزینه کل (دلار)',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          ${row.original.totalMoneySpent.toFixed(5)}
        </span>
      ),
    },
    {
      id: 'costIrt',
      header: 'هزینه کل (تومان)',
      cell: ({ row }) => {
        if (!usdToIrtRate) return <span className="text-xs text-slate-400">—</span>;
        const irt = row.original.totalMoneySpent * usdToIrtRate;
        return (
          <span className="font-mono text-xs font-bold text-emerald-700">
            {Math.round(irt).toLocaleString('fa-IR')} ت
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'عملیات',
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
      id: 'controls',
      header: 'کنترل پاسخ خودکار',
      cell: ({ row }) => {
        const chat = row.original;
        const busy = actionLoading?.id === chat.id;
        const isPaused = chat.status === 'sleep';
        const isDisabled = chat.status === 'disabled';
        return (
          <div className="flex items-center justify-center gap-1">
            {(isPaused || isDisabled) && (
              <button
                onClick={() => handleResume(chat)}
                disabled={busy}
                title="فعال‌سازی مجدد"
                type="button"
                className="cursor-pointer rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
              >
                <PlayCircle className="h-4 w-4" />
              </button>
            )}
            {!isDisabled && (
              <button
                onClick={() => handlePause(chat)}
                disabled={busy}
                title="توقف ۵ ساعته"
                type="button"
                className="cursor-pointer rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-50"
              >
                <PauseCircle className="h-4 w-4" />
              </button>
            )}
            {!isDisabled && (
              <button
                onClick={() => handleDisable(chat)}
                disabled={busy}
                title="غیرفعال دائمی"
                type="button"
                className="cursor-pointer rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
              >
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
              <p className="text-xs text-slate-400">
                لیست کامل گفتگوهای اتوماسیون تلگرام با تفکیک هزینه‌ها.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
                <span className="text-[11px] font-medium whitespace-nowrap text-slate-500">
                  نرخ دلار (تومان):
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  onInput={onInputP2EHandler}
                  value={irtRateInput}
                  onChange={(e) => setIrtRateInput(e.target.value)}
                  onBlur={handleIrtRateSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleIrtRateSave()}
                  placeholder="مثلاً ۹۵۰۰۰"
                  className="w-28 bg-transparent text-right font-mono text-xs text-slate-700 outline-none placeholder:text-slate-300"
                />
                {irtRateSaving && <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />}
                {irtRateSaved && <Check className="h-3 w-3 text-emerald-500" />}
              </div>
              <button
                onClick={() => fetchChats(page)}
                type="button"
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-600 shadow-xs hover:bg-slate-50"
              >
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

          {tableInstance && <DataTablePagination table={tableInstance} totalCount={totalCount} />}
        </div>
      </LayoutTable>

      {/* Chat history / logs drawer */}
      {selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
          <div className="relative flex h-full w-full max-w-xl flex-col border-r border-slate-200 bg-slate-50 shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                  {selectedChat.firstName ? selectedChat.firstName.charAt(0) : 'U'}
                </div>
                <div>
                  <div className="font-bold text-slate-800">
                    {[selectedChat.firstName, selectedChat.lastName].filter(Boolean).join(' ') ||
                      'کاربر ناشناس'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>شناسه: {selectedChat.telegramId}</span>
                    <span>•</span>
                    <span>مجموع هزینه: ${selectedChat.totalMoneySpent.toFixed(4)}</span>
                    {usdToIrtRate && (
                      <>
                        <span>≈</span>
                        <span className="font-medium text-emerald-600">
                          {Math.round(selectedChat.totalMoneySpent * usdToIrtRate).toLocaleString(
                            'fa-IR',
                          )}{' '}
                          تومان
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedChat(null);
                  setMessages([]);
                  setLogs([]);
                }}
                type="button"
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Admin AI controls */}
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
              <span className="text-[11px] font-medium text-slate-500">وضعیت پاسخ خودکار:</span>
              <StatusBadge chat={selectedChat} />
              <div className="mr-auto flex items-center gap-1.5">
                {selectedChat.status !== 'active' && selectedChat.status !== 'responding' && (
                  <button
                    onClick={() => handleResume(selectedChat)}
                    disabled={actionLoading?.id === selectedChat.id}
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    {actionLoading?.id === selectedChat.id && actionLoading.action === 'resume'
                      ? '...'
                      : 'فعال‌سازی مجدد'}
                  </button>
                )}
                {selectedChat.status !== 'disabled' && (
                  <button
                    onClick={() => handlePause(selectedChat)}
                    disabled={actionLoading?.id === selectedChat.id}
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                  >
                    <PauseCircle className="h-3.5 w-3.5" />
                    {actionLoading?.id === selectedChat.id && actionLoading.action === 'pause'
                      ? '...'
                      : 'توقف ۵ ساعته'}
                  </button>
                )}
                {selectedChat.status !== 'disabled' && (
                  <button
                    onClick={() => handleDisable(selectedChat)}
                    disabled={actionLoading?.id === selectedChat.id}
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    {actionLoading?.id === selectedChat.id && actionLoading.action === 'disable'
                      ? '...'
                      : 'غیرفعال دائمی'}
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0 gap-6 border-b border-slate-200 bg-white px-4 text-xs font-bold">
              <button
                onClick={() => handleTabChange('chat')}
                type="button"
                className={`cursor-pointer border-b-2 py-3.5 transition-all ${activeTab === 'chat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                تاریخچه گفتگوها
              </button>
              <button
                onClick={() => handleTabChange('logs')}
                type="button"
                className={`cursor-pointer border-b-2 py-3.5 transition-all ${activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                گزارش‌های هوش مصنوعی (Logs)
              </button>
            </div>

            {activeTab === 'chat' ? (
              <div
                ref={chatContainerRef}
                className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 leading-normal"
                style={{
                  backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              >
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-sm text-slate-500">در حال بارگذاری گفتگو...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 py-20 text-slate-400">
                    <MessageSquare className="h-8 w-8 text-slate-300" />
                    <span className="text-xs">هیچ پیامی در این گفتگو وجود ندارد</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex w-full ${isUser ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`relative max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-xs ${isUser ? 'rounded-br-none border border-slate-200 bg-white text-slate-800' : 'rounded-bl-none bg-blue-600 text-white'}`}
                        >
                          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold opacity-85">
                            {isUser ? (
                              <>
                                <UserIcon className="h-3 w-3 shrink-0" />
                                <span>{selectedChat.firstName || 'کاربر'}</span>
                              </>
                            ) : (
                              <>
                                <Bot className="h-3 w-3 shrink-0" />
                                <span>دستیار هوش مصنوعی</span>
                              </>
                            )}
                          </div>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>
                          {!isUser && (msg.tokensIn > 0 || msg.tokensOut > 0) && (
                            <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-white/20 pt-1.5 font-mono text-[9px] opacity-80">
                              <Cpu className="h-2.5 w-2.5" />
                              <span>In: {msg.tokensIn}</span>
                              <span>•</span>
                              <span>Out: {msg.tokensOut}</span>
                              <span>•</span>
                              <span>${msg.moneySpent.toFixed(5)}</span>
                            </div>
                          )}
                          <div
                            className={`mt-2 font-mono text-[8px] ${isUser ? 'text-left text-slate-400' : 'text-right text-blue-200'}`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-[11px] text-slate-500">
                    لیست ۵۰ لاگ اخیر ارتباط با هوش مصنوعی
                  </span>
                  <button
                    onClick={() => fetchLogs(selectedChat.id)}
                    type="button"
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-xs hover:bg-slate-50"
                  >
                    <RefreshCw className="h-3 w-3" />
                    بروزرسانی لاگ‌ها
                  </button>
                </div>

                {loadingLogs ? (
                  <div className="flex h-full items-center justify-center py-20">
                    <span className="text-sm text-slate-500">در حال بارگذاری تراکنش‌ها...</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 py-20 text-slate-400">
                    <Cpu className="h-8 w-8 animate-pulse text-slate-300" />
                    <span className="text-xs">هیچ گزارشی ثبت نشده است</span>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {logs.map((log) => {
                      const isSuccess = log.statusCode === 200;
                      const isOpen = expandedLogId === log.id;
                      let parsedRequest: {
                        system?: string;
                        messages?: Array<{ role: string; content: string }>;
                      } = {};
                      try {
                        parsedRequest = JSON.parse(log.requestPayload);
                      } catch {
                        parsedRequest = {};
                      }
                      let parsedResponse: {
                        text?: string;
                        usage?: {
                          promptTokens: number;
                          completionTokens: number;
                          totalTokens: number;
                        };
                      } | null = null;
                      try {
                        parsedResponse = JSON.parse(log.responsePayload);
                      } catch {
                        /* plain text */
                      }

                      return (
                        <div
                          key={log.id}
                          className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xs"
                        >
                          <div
                            onClick={() => setExpandedLogId(isOpen ? null : log.id)}
                            className="flex cursor-pointer items-center justify-between p-3.5 transition-colors select-none hover:bg-slate-50/50"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isSuccess ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}
                              >
                                {log.statusCode} {isSuccess ? 'موفق' : 'خطا'}
                              </span>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-800">
                                  <span>{log.provider}</span>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-slate-500">{log.model}</span>
                                </div>
                                <div className="text-[9px] text-slate-400">
                                  {new Date(log.createdAt).toLocaleDateString('fa-IR')} -{' '}
                                  {new Date(log.createdAt).toLocaleTimeString('fa-IR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })}
                                </div>
                              </div>
                            </div>
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            )}
                          </div>

                          {isOpen && (
                            <div className="space-y-4 border-t border-slate-100 bg-slate-50/50 p-4 text-xs">
                              <div className="space-y-2">
                                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                                  <Terminal className="h-3.5 w-3.5 text-slate-400" />
                                  <span>درخواست ارسالی (Request Payload)</span>
                                </div>
                                <div className="space-y-1 pl-1">
                                  <span className="text-[10px] font-medium text-slate-500">
                                    دستور سیستم (System Prompt):
                                  </span>
                                  <pre className="max-h-32 overflow-y-auto rounded-lg border border-slate-200/30 bg-slate-100/80 p-2.5 font-mono text-[9px] whitespace-pre-wrap text-slate-700 select-all">
                                    {parsedRequest.system || 'پرامپت خالی'}
                                  </pre>
                                </div>
                                <div className="mt-2 space-y-1 pl-1">
                                  <span className="text-[10px] font-medium text-slate-500">
                                    پیام‌های ارسال شده در کانتکست:
                                  </span>
                                  <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200/30 bg-slate-100/80 p-2.5">
                                    {parsedRequest.messages && parsedRequest.messages.length > 0 ? (
                                      parsedRequest.messages.map((m, idx) => (
                                        <div
                                          key={idx}
                                          className="border-b border-slate-200/20 pb-1 text-[9px] last:border-b-0 last:pb-0"
                                        >
                                          <span
                                            className={`font-bold ${m.role === 'user' ? 'text-blue-600' : 'text-purple-600'}`}
                                          >
                                            {m.role === 'user' ? 'User: ' : 'Assistant: '}
                                          </span>
                                          <span className="font-mono text-slate-700 select-all">
                                            {m.content}
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-[9px] text-slate-400">
                                        بدون تاریخچه قبلی
                                      </span>
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
                                    <pre className="rounded-lg border border-emerald-100/50 bg-emerald-50/20 p-3 font-mono text-[10px] whitespace-pre-wrap text-emerald-800 select-all">
                                      {parsedResponse?.text || log.responsePayload}
                                    </pre>
                                    {parsedResponse?.usage && (
                                      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200/10 bg-slate-100 p-2 font-mono text-[9px] text-slate-500">
                                        <span>توکن ورودی: {parsedResponse.usage.promptTokens}</span>
                                        <span>•</span>
                                        <span>
                                          توکن خروجی: {parsedResponse.usage.completionTokens}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          توکن کل:{' '}
                                          {parsedResponse.usage.totalTokens ||
                                            parsedResponse.usage.promptTokens +
                                              parsedResponse.usage.completionTokens}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-2.5">
                                    <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-rose-800">
                                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold">
                                        <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                                        خطا در فراخوانی هوش مصنوعی
                                      </div>
                                      <p className="font-mono text-[10px] leading-normal whitespace-pre-wrap select-all">
                                        {log.errorMessage}
                                      </p>
                                    </div>
                                    {log.responsePayload && (
                                      <div className="space-y-1 pl-1">
                                        <span className="text-[9px] font-bold text-slate-500">
                                          کد رهگیری / Traceback:
                                        </span>
                                        <pre className="max-h-40 overflow-x-auto overflow-y-auto rounded-lg border border-rose-950/20 bg-slate-900 p-2.5 font-mono text-[8px] whitespace-pre-wrap text-rose-300 select-all">
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
