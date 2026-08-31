'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/hooks/swr/api-client';
import { toast } from 'sonner';
import { Bot, MessageSquare, RotateCcw, Send, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  notes?: string[];
}

export default function TestChatPage() {
  const t_ec = useTranslations('ERROR_CODES');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight });
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { id: crypto.randomUUID(), role: 'user', content: text },
    ];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const { data } = await api.post('/telegram-automation/test-chat', {
        messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
      });
      const result = data?.data || data;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result?.reply || '',
          notes: result?.notes || [],
        },
      ]);
    } catch (err: any) {
      toast.error(t_ec(err?.response?.data?.code) || 'خطا در تولید پاسخ هوش مصنوعی');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">چت آزمایشی هوش مصنوعی</h1>
            <p className="mt-1 text-xs text-slate-400">
              همین دستیار هوش مصنوعی که در تلگرام به کاربران پاسخ می‌دهد، اینجا برای تست در دسترس
              است. این گفتگو در هیچ‌کجا ذخیره نمی‌شود و پیامی روی تلگرام واقعی ارسال نمی‌شود.
            </p>
          </div>
          <Button
            variant="outline"
            type="button"
            onClick={() => setMessages([])}
            disabled={messages.length === 0 || sending}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            شروع دوباره
          </Button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
          <div
            ref={containerRef}
            className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 leading-normal"
            style={{
              backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-20 text-slate-400">
                <MessageSquare className="h-8 w-8 text-slate-300" />
                <span className="text-xs">برای شروع، پیامی مثل یک کاربر واقعی بنویسید</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex w-full flex-col ${isUser ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`relative max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-xs ${
                        isUser
                          ? 'rounded-br-none border border-slate-200 bg-white text-slate-800'
                          : 'rounded-bl-none bg-blue-600 text-white'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold opacity-85">
                        {isUser ? (
                          <>
                            <UserIcon className="h-3 w-3 shrink-0" />
                            <span>ادمین (تست)</span>
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
                    </div>
                    {!isUser && msg.notes && msg.notes.length > 0 && (
                      <div className="mt-1 max-w-[85%] space-y-0.5">
                        {msg.notes.map((note, i) => (
                          <div key={i} className="text-[10px] text-slate-400 italic">
                            🔔 {note}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {sending && (
              <div className="flex w-full justify-end">
                <div className="rounded-2xl rounded-bl-none bg-blue-600/60 px-3.5 py-2.5 text-xs text-white">
                  در حال تایپ...
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end gap-2 border-t border-slate-100 p-3">
            <Textarea
              className="min-h-[44px] resize-none"
              placeholder="پیام خود را بنویسید..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              dir="rtl"
              disabled={sending}
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              ارسال
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
