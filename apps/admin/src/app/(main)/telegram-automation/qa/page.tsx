"use client";

import { useEffect, useState } from "react";
import api from "@/hooks/swr/api-client";
import { toast } from "sonner";
import { Trash2, PlusCircle, HelpCircle, Pencil, Check, X } from "lucide-react";

interface QaType {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export default function QAPage() {
  const [qaList, setQaList] = useState<QaType[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchQa = async (pageNum: number = page) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/telegram-automation/qa?page=${pageNum}&limit=${limit}`);
      const payload = data?.data || data || {};
      const items: QaType[] = payload.items || [];
      const meta = payload.meta || {};
      // If a delete emptied the last page, step back one page
      if (items.length === 0 && pageNum > 1) {
        setPage(pageNum - 1);
        return;
      }
      setQaList(items);
      setTotalPages(meta.totalPages || 1);
      setTotalItems(meta.totalItems ?? items.length);
      setPage(meta.currentPage || pageNum);
    } catch {
      toast.error("خطا در دریافت پرسش و پاسخ‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQa(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleAddQa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast.error("لطفاً هم پرسش و هم پاسخ را تکمیل کنید");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post("/telegram-automation/qa", { question, answer });
      const created = data?.data || data;
      if (created) {
        setQuestion("");
        setAnswer("");
        // Newest items appear first on page 1
        if (page === 1) {
          fetchQa(1);
        } else {
          setPage(1);
        }
        toast.success("پرسش و پاسخ با موفقیت اضافه شد");
      }
    } catch {
      toast.error("خطا در ذخیره پرسش و پاسخ");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQa = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/telegram-automation/qa/${id}`);
      await fetchQa(page);
      toast.success("آیتم با موفقیت حذف شد");
    } catch {
      toast.error("خطا در حذف آیتم");
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
    setEditQuestion("");
    setEditAnswer("");
  };

  const handleUpdateQa = async (id: string) => {
    if (!editQuestion.trim() || !editAnswer.trim()) {
      toast.error("پرسش و پاسخ نمی‌توانند خالی باشند");
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
      toast.success("پرسش و پاسخ به‌روزرسانی شد");
    } catch {
      toast.error("خطا در ویرایش پرسش و پاسخ");
    } finally {
      setUpdatingId(null);
    }
  };

  const inputClasses =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";
  const textareaClasses =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 h-28";
  const labelClasses = "text-sm font-medium text-gray-700 dark:text-gray-300";
  const buttonPrimary =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">پرسش و پاسخ (Q/A)</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            زوج‌های پرسش و پاسخ متداول که هوش مصنوعی برای پاسخ‌دهی دقیق‌تر از آن‌ها بهره می‌برد.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Add form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-blue-500" />
                افزودن پرسش و پاسخ جدید
              </h2>
              <form onSubmit={handleAddQa} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClasses}>پرسش</label>
                  <input
                    type="text"
                    className={inputClasses}
                    placeholder="مثال: هزینه ارسال چقدر است؟"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClasses}>پاسخ</label>
                  <textarea
                    className={textareaClasses}
                    placeholder="توضیحات پاسخ متناظر..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className={buttonPrimary + " w-full"}
                  disabled={saving}
                >
                  {saving ? "در حال ثبت..." : "افزودن به لیست"}
                </button>
              </form>
            </div>
          </div>

          {/* List display */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              لیست پرسش و پاسخ‌ها ({totalItems})
            </h2>

            {loading ? (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
                <span className="text-sm text-gray-500">در حال بارگذاری...</span>
              </div>
            ) : qaList.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
                <HelpCircle className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-500">هنوز هیچ پرسش و پاسخی ثبت نشده است</p>
                <p className="text-xs text-gray-400 mt-1">از فرم سمت راست برای تعریف اولین مورد استفاده کنید</p>
              </div>
            ) : (
              <div className="space-y-4">
                {qaList.map((item) =>
                  editingId === item.id ? (
                    // Edit mode
                    <div
                      key={item.id}
                      className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-800 dark:bg-blue-950/20"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClasses}>پرسش</label>
                          <input
                            type="text"
                            className={inputClasses}
                            value={editQuestion}
                            onChange={(e) => setEditQuestion(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClasses}>پاسخ</label>
                          <textarea
                            className={textareaClasses}
                            value={editAnswer}
                            onChange={(e) => setEditAnswer(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateQa(item.id)}
                            disabled={updatingId === item.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                            type="button"
                          >
                            <Check className="h-3.5 w-3.5" />
                            {updatingId === item.id ? "در حال ذخیره..." : "ذخیره"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                            type="button"
                          >
                            <X className="h-3.5 w-3.5" />
                            انصراف
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div
                      key={item.id}
                      className="group relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900 flex gap-4 items-start"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-start gap-2">
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            س
                          </span>
                          <span>{item.question}</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2 pr-1">
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-50 text-[10px] font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            پ
                          </span>
                          <p className="leading-relaxed whitespace-pre-wrap">{item.answer}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 self-start">
                        <button
                          onClick={() => startEdit(item)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-500 dark:hover:bg-blue-950/20 dark:hover:text-blue-400 transition-all cursor-pointer"
                          title="ویرایش"
                          type="button"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQa(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-all cursor-pointer disabled:opacity-50"
                          title="حذف"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1 || loading}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 disabled:opacity-50 dark:border-gray-700 cursor-pointer"
                  type="button"
                >
                  قبلی
                </button>
                <span className="text-xs text-gray-500">
                  صفحه {page} از {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages || loading}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 disabled:opacity-50 dark:border-gray-700 cursor-pointer"
                  type="button"
                >
                  بعدی
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
