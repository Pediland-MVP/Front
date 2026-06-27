'use client';

import { useEffect, useState } from 'react';
import api from '@/hooks/swr/api-client';
import { toast } from 'sonner';
import { Trash2, PlusCircle, HelpCircle, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface QaType {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export default function QAPage() {
  const [qaList, setQaList] = useState<QaType[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchQa = async (pageNum: number = page) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/telegram-automation/qa?page=${pageNum}&limit=${limit}`);
      const payload = data?.data || data || {};
      const items: QaType[] = payload.items || [];
      const meta = payload.meta || {};
      if (items.length === 0 && pageNum > 1) {
        setPage(pageNum - 1);
        return;
      }
      setQaList(items);
      setTotalPages(meta.totalPages || 1);
      setTotalItems(meta.totalItems ?? items.length);
      setPage(meta.currentPage || pageNum);
    } catch {
      toast.error('خطا در دریافت پرسش و پاسخ‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQa(page); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [page]);

  const handleAddQa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast.error('لطفاً هم پرسش و هم پاسخ را تکمیل کنید');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/telegram-automation/qa', { question, answer });
      const created = data?.data || data;
      if (created) {
        setQuestion('');
        setAnswer('');
        page === 1 ? fetchQa(1) : setPage(1);
        toast.success('پرسش و پاسخ با موفقیت اضافه شد');
      }
    } catch {
      toast.error('خطا در ذخیره پرسش و پاسخ');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQa = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/telegram-automation/qa/${id}`);
      await fetchQa(page);
      toast.success('آیتم با موفقیت حذف شد');
    } catch {
      toast.error('خطا در حذف آیتم');
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (item: QaType) => {
    setEditingId(item.id);
    setEditQuestion(item.question);
    setEditAnswer(item.answer);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const handleUpdateQa = async (id: string) => {
    if (!editQuestion.trim() || !editAnswer.trim()) {
      toast.error('پرسش و پاسخ نمی‌توانند خالی باشند');
      return;
    }
    setUpdatingId(id);
    try {
      const { data } = await api.put(`/telegram-automation/qa/${id}`, {
        question: editQuestion,
        answer: editAnswer,
      });
      const updated = data?.data || data;
      setQaList((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
      cancelEdit();
      toast.success('پرسش و پاسخ به‌روزرسانی شد');
    } catch {
      toast.error('خطا در ویرایش پرسش و پاسخ');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-4 lg:flex lg:h-full lg:flex-col lg:p-6">
      <div className="mx-auto w-full max-w-5xl space-y-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-8 lg:space-y-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">پرسش و پاسخ (Q/A)</h1>
          <p className="mt-1 text-xs text-slate-400">
            زوج‌های پرسش و پاسخ متداول که هوش مصنوعی برای پاسخ‌دهی دقیق‌تر از آن‌ها بهره می‌برد.
          </p>
        </div>

        <div className="grid gap-8 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
          {/* Add form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
                <PlusCircle className="h-5 w-5 text-blue-500" />
                افزودن پرسش و پاسخ جدید
              </h2>
              <form onSubmit={handleAddQa} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label>پرسش</Label>
                  <Input
                    placeholder="مثال: هزینه ارسال چقدر است؟"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>پاسخ</Label>
                  <Textarea
                    className="min-h-[112px]"
                    placeholder="توضیحات پاسخ متناظر..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? 'در حال ثبت...' : 'افزودن به لیست'}
                </Button>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="space-y-4 lg:col-span-2 lg:flex lg:min-h-0 lg:flex-col lg:gap-4 lg:space-y-0">
            <h2 className="shrink-0 text-base font-bold text-slate-800">
              لیست پرسش و پاسخ‌ها ({totalItems})
            </h2>

            <div className="scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pl-1">
              {loading ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-100 bg-white">
                  <span className="text-sm text-slate-400">در حال بارگذاری...</span>
                </div>
              ) : qaList.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
                  <HelpCircle className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">
                    هنوز هیچ پرسش و پاسخی ثبت نشده است
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    از فرم سمت راست برای تعریف اولین مورد استفاده کنید
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {qaList.map((item) =>
                    editingId === item.id ? (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs"
                      >
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <Label>پرسش</Label>
                            <Input
                              value={editQuestion}
                              onChange={(e) => setEditQuestion(e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label>پاسخ</Label>
                            <Textarea
                              className="min-h-[112px]"
                              value={editAnswer}
                              onChange={(e) => setEditAnswer(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateQa(item.id)}
                              disabled={updatingId === item.id}
                              type="button"
                            >
                              <Check className="h-3.5 w-3.5" />
                              {updatingId === item.id ? 'در حال ذخیره...' : 'ذخیره'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} type="button">
                              <X className="h-3.5 w-3.5" />
                              انصراف
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={item.id}
                        className="group relative flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-2 text-sm font-bold text-slate-800">
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-bold text-blue-600">
                              س
                            </span>
                            <span>{item.question}</span>
                          </div>
                          <div className="flex items-start gap-2 pr-1 text-sm text-slate-600">
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-50 text-[10px] font-bold text-emerald-600">
                              پ
                            </span>
                            <p className="leading-relaxed whitespace-pre-wrap">{item.answer}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 self-start">
                          <button
                            onClick={() => startEdit(item)}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="ویرایش"
                            type="button"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQa(item.id)}
                            disabled={deletingId === item.id}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                            title="حذف"
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex shrink-0 items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1 || loading}
                  type="button"
                >
                  قبلی
                </Button>
                <span className="text-xs text-slate-500">
                  صفحه {page} از {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages || loading}
                  type="button"
                >
                  بعدی
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
