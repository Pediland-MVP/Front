'use client';

import { useEffect, useState } from 'react';
import api from '@/hooks/swr/api-client';
import { toast } from 'sonner';
import {
  Trash2,
  PlusCircle,
  BookOpen,
  Link2,
  Video,
  AlignLeft,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GuideType {
  id: string;
  type: 'text' | 'video_forward' | 'link';
  target: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

type GuideFormType = 'text' | 'video_forward' | 'link';

export default function GuidesPage() {
  const [guides, setGuides] = useState<GuideType[]>([]);
  const [type, setType] = useState<GuideFormType>('text');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<GuideFormType>('text');
  const [editDescription, setEditDescription] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchGuides = async (pageNum: number = page) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/telegram-automation/guides?page=${pageNum}&limit=${limit}`);
      const payload = data?.data || data || {};
      const items: GuideType[] = payload.items || [];
      const meta = payload.meta || {};
      if (items.length === 0 && pageNum > 1) {
        setPage(pageNum - 1);
        return;
      }
      setGuides(items);
      setTotalPages(meta.totalPages || 1);
      setTotalItems(meta.totalItems ?? items.length);
      setPage(meta.currentPage || pageNum);
    } catch {
      toast.error('خطا در دریافت پست‌های راهنما');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides(page); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [page]);

  const handleAddGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !target.trim()) {
      toast.error('لطفاً تمامی فیلدهای فرم را پر کنید');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/telegram-automation/guides', { type, target, description });
      const created = data?.data || data;
      if (created) {
        setDescription('');
        setTarget('');
        page === 1 ? fetchGuides(1) : setPage(1);
        toast.success('راهنما با موفقیت ایجاد شد');
      }
    } catch {
      toast.error('خطا در ذخیره پست راهنما');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGuide = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/telegram-automation/guides/${id}`);
      await fetchGuides(page);
      toast.success('راهنما با موفقیت حذف شد');
    } catch {
      toast.error('خطا در حذف راهنما');
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
    setEditType('text');
    setEditDescription('');
    setEditTarget('');
  };

  const handleUpdateGuide = async (id: string) => {
    if (!editDescription.trim() || !editTarget.trim()) {
      toast.error('تمام فیلدها الزامی هستند');
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
      toast.success('راهنما به‌روزرسانی شد');
    } catch {
      toast.error('خطا در ویرایش راهنما');
    } finally {
      setUpdatingId(null);
    }
  };

  const getIcon = (t: string) => {
    switch (t) {
      case 'link':
        return <Link2 className="h-4 w-4 text-indigo-500" />;
      case 'video_forward':
        return <Video className="h-4 w-4 text-rose-500" />;
      default:
        return <AlignLeft className="h-4 w-4 text-emerald-500" />;
    }
  };

  const getTypeTitle = (t: string) => {
    switch (t) {
      case 'link':
        return 'لینک پست';
      case 'video_forward':
        return 'پیام ویدیویی / پیام';
      default:
        return 'متن ساده';
    }
  };

  const TargetInput = ({
    value,
    onChange,
    type: t,
  }: {
    value: string;
    onChange: (v: string) => void;
    type: GuideFormType;
  }) =>
    t === 'text' ? (
      <Textarea
        className="min-h-[112px]"
        placeholder="متن راهنمای خود را بنویسید..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <Input
        dir="ltr"
        placeholder={
          t === 'video_forward' ? 'شناسه (ID) پیام تلگرام...' : 'https://example.com/post'
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );

  return (
    <div className="p-4 lg:flex lg:h-full lg:flex-col lg:p-6">
      <div className="mx-auto w-full max-w-5xl space-y-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-8 lg:space-y-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">پست‌های راهنما</h1>
          <p className="mt-1 text-xs text-slate-400">
            مستندات آماده، پیوندها یا ویدیوهایی که هوش مصنوعی می‌تواند به طور هوشمند به کاربران
            ارسال کند.
          </p>
        </div>

        <div className="grid gap-8 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
                <PlusCircle className="h-5 w-5 text-blue-500" />
                تعریف پست راهنمای جدید
              </h2>
              <form onSubmit={handleAddGuide} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label>نوع راهنما</Label>
                  <Select value={type} onValueChange={(v) => setType(v as GuideFormType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">متن ساده</SelectItem>
                      <SelectItem value="video_forward">فوروارد ویدیو / پیام</SelectItem>
                      <SelectItem value="link">لینک پست / آدرس اینترنتی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>توضیحات کوتاه برای هوش مصنوعی</Label>
                  <Input
                    placeholder="مثال: نحوه نصب نرم‌افزار روی ویندوز"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-[11px] leading-normal text-slate-400">
                    این فیلد به هوش مصنوعی توضیح می‌دهد این راهنما چیست.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>محتوا / ID پیام تلگرام / لینک</Label>
                  <TargetInput value={target} onChange={setTarget} type={type} />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? 'در حال ثبت...' : 'افزودن پست راهنما'}
                </Button>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="space-y-4 lg:col-span-2 lg:flex lg:min-h-0 lg:flex-col lg:gap-4 lg:space-y-0">
            <h2 className="shrink-0 text-base font-bold text-slate-800">
              لیست پست‌های راهنما ({totalItems})
            </h2>

            <div className="scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pl-1">
              {loading ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-100 bg-white">
                  <span className="text-sm text-slate-400">در حال بارگذاری...</span>
                </div>
              ) : guides.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
                  <BookOpen className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">
                    هنوز هیچ راهنمایی تعریف نشده است
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    از فرم سمت راست برای ایجاد اولین راهنما استفاده کنید
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {guides.map((item) =>
                    editingId === item.id ? (
                      <div
                        key={item.id}
                        className="col-span-full rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs"
                      >
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <Label>نوع راهنما</Label>
                            <Select
                              value={editType}
                              onValueChange={(v) => setEditType(v as GuideFormType)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">متن ساده</SelectItem>
                                <SelectItem value="video_forward">فوروارد ویدیو / پیام</SelectItem>
                                <SelectItem value="link">لینک پست / آدرس اینترنتی</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label>توضیحات</Label>
                            <Input
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label>محتوا / لینک / ID</Label>
                            <TargetInput
                              value={editTarget}
                              onChange={setEditTarget}
                              type={editType}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateGuide(item.id)}
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
                        className="group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
                              {getIcon(item.type)}
                              {getTypeTitle(item.type)}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEdit(item)}
                                className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                title="ویرایش"
                                type="button"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteGuide(item.id)}
                                disabled={deletingId === item.id}
                                className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                title="حذف"
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-slate-800">{item.description}</div>
                          <p className="line-clamp-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5 font-mono text-xs break-all text-slate-500">
                            {item.target}
                          </p>
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
