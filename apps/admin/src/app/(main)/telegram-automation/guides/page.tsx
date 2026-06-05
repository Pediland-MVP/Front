"use client";

import { useEffect, useState } from "react";
import api from "@/hooks/swr/api-client";
import { toast } from "sonner";
import { Trash2, PlusCircle, BookOpen, Link2, Video, AlignLeft, Pencil, Check, X } from "lucide-react";

interface GuideType {
  id: string;
  type: "text" | "video_forward" | "link";
  target: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

type GuideFormType = "text" | "video_forward" | "link";

export default function GuidesPage() {
  const [guides, setGuides] = useState<GuideType[]>([]);
  const [type, setType] = useState<GuideFormType>("text");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
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
  const [editType, setEditType] = useState<GuideFormType>("text");
  const [editDescription, setEditDescription] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchGuides = async (pageNum: number = page) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/telegram-automation/guides?page=${pageNum}&limit=${limit}`);
      const payload = data?.data || data || {};
      const items: GuideType[] = payload.items || [];
      const meta = payload.meta || {};
      // If a delete emptied the last page, step back one page
      if (items.length === 0 && pageNum > 1) {
        setPage(pageNum - 1);
        return;
      }
      setGuides(items);
      setTotalPages(meta.totalPages || 1);
      setTotalItems(meta.totalItems ?? items.length);
      setPage(meta.currentPage || pageNum);
    } catch {
      toast.error("خطا در دریافت پست‌های راهنما");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleAddGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !target.trim()) {
      toast.error("لطفاً تمامی فیلدهای فرم را پر کنید");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post("/telegram-automation/guides", { type, target, description });
      const created = data?.data || data;
      if (created) {
        setDescription("");
        setTarget("");
        // Newest items appear first on page 1
        if (page === 1) {
          fetchGuides(1);
        } else {
          setPage(1);
        }
        toast.success("راهنما با موفقیت ایجاد شد");
      }
    } catch {
      toast.error("خطا در ذخیره پست راهنما");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGuide = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/telegram-automation/guides/${id}`);
      await fetchGuides(page);
      toast.success("راهنما با موفقیت حذف شد");
    } catch {
      toast.error("خطا در حذف راهنما");
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (g: GuideType) => {
    setEditingId(g.id);
    setEditType(g.type);
    setEditDescription(g.description);
    setEditTarget(g.target);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditType("text");
    setEditDescription("");
    setEditTarget("");
  };

  const handleUpdateGuide = async (id: string) => {
    if (!editDescription.trim() || !editTarget.trim()) {
      toast.error("تمام فیلدها الزامی هستند");
      return;
    }
    setUpdatingId(id);
    try {
      const { data } = await api.put(`/telegram-automation/guides/${id}`, {
        type: editType,
        description: editDescription,
        target: editTarget,
      });
      const updated = data?.data || data;
      setGuides((prev) => prev.map((g) => (g.id === id ? { ...g, ...updated } : g)));
      cancelEdit();
      toast.success("راهنما به‌روزرسانی شد");
    } catch {
      toast.error("خطا در ویرایش راهنما");
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

  const getIcon = (t: string) => {
    switch (t) {
      case "link": return <Link2 className="h-5 w-5 text-indigo-500" />;
      case "video_forward": return <Video className="h-5 w-5 text-rose-500" />;
      default: return <AlignLeft className="h-5 w-5 text-emerald-500" />;
    }
  };

  const getTypeTitle = (t: string) => {
    switch (t) {
      case "link": return "لینک پست";
      case "video_forward": return "پیام ویدیویی / پیام";
      default: return "متن ساده";
    }
  };

  const TargetInput = ({ value, onChange, type: t }: { value: string; onChange: (v: string) => void; type: GuideFormType }) =>
    t === "text" ? (
      <textarea
        className={textareaClasses}
        placeholder="متن راهنمای خود را بنویسید..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input
        type="text"
        className={inputClasses}
        placeholder={t === "video_forward" ? "شناسه (ID) پیام تلگرام..." : "https://example.com/post"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir="ltr"
      />
    );

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">پست‌های راهنما</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            مستندات آماده، پیوندها یا ویدیوهایی که هوش مصنوعی می‌تواند به طور هوشمند و در قالب ابزار به کاربران ارسال کند.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-blue-500" />
                تعریف پست راهنمای جدید
              </h2>
              <form onSubmit={handleAddGuide} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClasses}>نوع راهنما</label>
                  <select className={inputClasses} value={type} onChange={(e) => setType(e.target.value as GuideFormType)}>
                    <option value="text">متن ساده</option>
                    <option value="video_forward">فوروارد ویدیو / پیام</option>
                    <option value="link">لینک پست / آدرس اینترنتی</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClasses}>توضیحات کوتاه برای هوش مصنوعی</label>
                  <input
                    type="text"
                    className={inputClasses}
                    placeholder="مثال: نحوه نصب نرم‌افزار روی ویندوز"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-normal">
                    این فیلد به هوش مصنوعی توضیح می‌دهد این راهنما چیست.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClasses}>محتوا / ID پیام تلگرام / لینک</label>
                  <TargetInput value={target} onChange={setTarget} type={type} />
                </div>
                <button type="submit" className={buttonPrimary + " w-full"} disabled={saving}>
                  {saving ? "در حال ثبت..." : "افزودن پست راهنما"}
                </button>
              </form>
            </div>
          </div>

          {/* List display */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              لیست پست‌های راهنما ({totalItems})
            </h2>

            {loading ? (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
                <span className="text-sm text-gray-500">در حال بارگذاری...</span>
              </div>
            ) : guides.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
                <BookOpen className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-500">هنوز هیچ راهنمایی تعریف نشده است</p>
                <p className="text-xs text-gray-400 mt-1">از فرم سمت راست برای ایجاد اولین راهنما استفاده کنید</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {guides.map((item) =>
                  editingId === item.id ? (
                    // Edit mode
                    <div
                      key={item.id}
                      className="col-span-full rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-800 dark:bg-blue-950/20"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClasses}>نوع راهنما</label>
                          <select
                            className={inputClasses}
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as GuideFormType)}
                          >
                            <option value="text">متن ساده</option>
                            <option value="video_forward">فوروارد ویدیو / پیام</option>
                            <option value="link">لینک پست / آدرس اینترنتی</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClasses}>توضیحات</label>
                          <input
                            type="text"
                            className={inputClasses}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClasses}>محتوا / لینک / ID</label>
                          <TargetInput value={editTarget} onChange={setEditTarget} type={editType} />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateGuide(item.id)}
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
                      className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                            {getIcon(item.type)}
                            {getTypeTitle(item.type)}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(item)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-500 dark:hover:bg-blue-950/20 dark:hover:text-blue-400 transition-all cursor-pointer"
                              title="ویرایش"
                              type="button"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGuide(item.id)}
                              disabled={deletingId === item.id}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-all cursor-pointer disabled:opacity-50"
                              title="حذف"
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {item.description}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all line-clamp-3 bg-gray-50 dark:bg-gray-950 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                          {item.target}
                        </p>
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
