// src/app/(main)/guides/guides-table.tsx
'use client';

import { useState, useRef } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Trash2,
  Edit,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Quote,
  Image as ImageIcon,
  Video as VideoIcon,
  Link as LinkIcon,
  Palette,
  Eye,
  FileText,
  HelpCircle,
} from 'lucide-react';

import { LayoutTable } from '@/components/layout/LayoutTable';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/hooks/swr/api-client';
import { onInputP2EHandler } from '@/lib/p2eNumber';

// Helper for parsing simple Markdown to HTML for preview
export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  let html = markdown;

  // Escape HTML tags to prevent XSS (except allowed span tags for colors)
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Restore allowed span tags for colors (like <span style="color: ...">...</span>)
  html = html.replace(
    /&lt;span\s+style=&quot;color:\s*(#[0-9a-fA-F]{3,6}|[a-zA-Z]+);?&quot;&gt;([\s\S]*?)&lt;\/span&gt;/gi,
    (match, color, content) => {
      return `<span style="color: ${color}">${content}</span>`;
    },
  );

  // Headers
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold my-4 text-slate-800">$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold my-3 text-slate-800">$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold my-2 text-slate-800">$1</h3>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Code block
  html = html.replace(
    /```([\s\S]*?)```/g,
    '<pre class="bg-slate-800 text-slate-100 p-3 rounded-lg font-mono text-sm overflow-auto my-3" dir="ltr">$1</pre>',
  );

  // Inline code
  html = html.replace(
    /`(.*?)`/g,
    '<code class="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-sm" dir="ltr">$1</code>',
  );

  // Blockquote
  html = html.replace(
    /^&gt; (.*?)$/gm,
    '<blockquote class="border-r-4 border-blue-500 pr-4 pl-2 py-2 bg-slate-50 my-3 italic text-slate-600">$1</blockquote>',
  );

  // Images
  html = html.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4 shadow-sm border border-slate-100" />',
  );

  // Links
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" class="text-blue-600 hover:underline hover:text-blue-800 font-medium">$1</a>',
  );

  // Lists
  html = html.replace(
    /^\s*-\s+(.*?)$/gm,
    '<li class="list-disc list-inside mr-4 my-1 text-slate-700">$1</li>',
  );

  // Newlines to paragraph breaks (if not inside list/header tags)
  const lines = html.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('<blockquote') ||
      trimmed.startsWith('<pre') ||
      trimmed.startsWith('<img') ||
      trimmed.startsWith('<p')
    ) {
      return line;
    }
    return `<p class="my-2 leading-relaxed text-slate-700">${line}</p>`;
  });

  return processedLines.join('\n');
}

// Schemas
const GuideCategorySchema = z.object({
  name: z.string().min(1, 'نام دسته‌بندی اجباری است'),
  order: z.number().default(0),
});

const GuideSchema = z.object({
  title: z.string().min(1, 'عنوان راهنما اجباری است'),
  description: z.string().optional(),
  content: z.string().min(1, 'محتوای راهنما اجباری است'),
  coverImage: z.string().optional().or(z.literal('')),
  videoUrl: z.string().optional().or(z.literal('')),
  helpId: z.string().optional().or(z.literal('')),
  order: z.number().default(0),
  categoryId: z.number({ required_error: 'انتخاب دسته‌بندی اجباری است' }),
});

interface GuidesTableProps {
  isRefetching: boolean;
  guides: any[];
  categories: any[];
  mutateGuides: () => void;
  mutateCategories: () => void;
}

export default function GuidesTable({
  isRefetching,
  guides,
  categories,
  mutateGuides,
  mutateCategories,
}: GuidesTableProps) {
  const t = useTranslations('Guides');

  // State
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Upload States
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);

  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const [editorUploading, setEditorUploading] = useState(false);
  const [editorProgress, setEditorProgress] = useState(0);

  // Upload handler for image (cover or editor)
  const handleUploadImage = async (file: File, type: 'cover' | 'editor') => {
    if (!file.type.startsWith('image/')) {
      toast.error('فرمت فایل باید تصویر باشد');
      return;
    }
    if (file.size > 3_000_000) {
      toast.error('حداکثر حجم تصویر مجاز ۳ مگابایت است');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('در حال آپلود تصویر...');
    if (type === 'cover') {
      setCoverUploading(true);
      setCoverProgress(0);
    } else {
      setEditorUploading(true);
      setEditorProgress(0);
    }

    try {
      const res = await api.post('/guides/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            if (type === 'cover') setCoverProgress(percent);
            else setEditorProgress(percent);
            toast.loading(`در حال آپلود تصویر: ${percent}%`, { id: toastId });
          }
        },
      });

      const url = res.data?.data?.url;
      if (url) {
        if (type === 'cover') {
          guideForm.setValue('coverImage', url);
          toast.success('تصویر کاور با موفقیت آپلود شد', { id: toastId });
        } else {
          insertText(`![تصویر](${url})`);
          toast.success('تصویر با موفقیت در ویرایشگر درج شد', { id: toastId });
        }
      } else {
        toast.error('آپلود تصویر با خطا مواجه شد', { id: toastId });
      }
    } catch (err: any) {
      toast.error('آپلود تصویر با خطا مواجه شد', { id: toastId });
    } finally {
      if (type === 'cover') setCoverUploading(false);
      else setEditorUploading(false);
    }
  };

  // Upload handler for video (main or editor)
  const handleUploadVideo = async (file: File, type: 'video' | 'editor') => {
    if (!file.type.startsWith('video/')) {
      toast.error('فرمت فایل باید ویدیو باشد');
      return;
    }
    if (file.size > 1_000_000_000) {
      toast.error('حداکثر حجم ویدیو مجاز ۱ گیگابایت است');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('در حال آپلود ویدیو (ممکن است طول بکشد)...');
    if (type === 'video') {
      setVideoUploading(true);
      setVideoProgress(0);
    } else {
      setEditorUploading(true);
      setEditorProgress(0);
    }

    try {
      const res = await api.post('/guides/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            if (type === 'video') setVideoProgress(percent);
            else setEditorProgress(percent);
            toast.loading(`در حال آپلود ویدیو: ${percent}%`, { id: toastId });
          }
        },
      });

      const url = res.data?.data?.url;
      if (url) {
        if (type === 'video') {
          guideForm.setValue('videoUrl', url);
          toast.success('ویدیو با موفقیت آپلود شد', { id: toastId });
        } else {
          insertText(`[video](${url})`);
          toast.success('ویدیو با موفقیت در ویرایشگر درج شد', { id: toastId });
        }
      } else {
        toast.error('آپلود ویدیو با خطا مواجه شد', { id: toastId });
      }
    } catch (err: any) {
      toast.error('آپلود ویدیو با خطا مواجه شد', { id: toastId });
    } finally {
      if (type === 'video') setVideoUploading(false);
      else setEditorUploading(false);
    }
  };

  // Forms
  const guideForm = useForm({
    resolver: zodResolver(GuideSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      coverImage: '',
      videoUrl: '',
      helpId: '',
      order: 0,
      categoryId: undefined as any,
    },
  });

  const categoryForm = useForm({
    resolver: zodResolver(GuideCategorySchema),
    defaultValues: {
      name: '',
      order: 0,
    },
  });

  // Editor toolbar actions helper
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = before + selected + after;
    const newValue = text.substring(0, start) + replacement + text.substring(end);

    guideForm.setValue('content', newValue);

    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const handleInsertColor = (colorCode: string) => {
    insertText(`<span style="color: ${colorCode}">`, '</span>');
    setColorPopoverOpen(false);
  };

  const handleInsertImage = () => {
    const upload = confirm(
      'آیا مایلید تصویری از کامپیوتر خود آپلود کنید؟ (برای درج لینک دستی Cancel را بزنید)',
    );
    if (upload) {
      document.getElementById('editor-image-upload')?.click();
    } else {
      const url = prompt('لطفا آدرس تصویر را وارد کنید:');
      if (!url) return;
      const alt = prompt('توضیح تصویر (اختیاری):') || 'تصویر';
      insertText(`![${alt}](${url})`);
    }
  };

  const handleInsertVideo = () => {
    const upload = confirm(
      'آیا مایلید ویدیویی از کامپیوتر خود آپلود کنید؟ (برای درج لینک دستی Cancel را بزنید)',
    );
    if (upload) {
      document.getElementById('editor-video-upload')?.click();
    } else {
      const url = prompt('لطفا آدرس ویدیو را وارد کنید:');
      if (!url) return;
      insertText(`[video](${url})`);
    }
  };

  const handleInsertLink = () => {
    const url = prompt('لطفا آدرس لینک را وارد کنید:');
    if (!url) return;
    const title = prompt('عنوان لینک (اختیاری):') || 'لینک';
    insertText(`[${title}](${url})`);
  };

  // CRUD actions for Guide
  const handleOpenAddGuide = () => {
    setSelectedGuide(null);
    guideForm.reset({
      title: '',
      description: '',
      content: '',
      coverImage: '',
      videoUrl: '',
      helpId: '',
      order: 0,
      categoryId: categories.length > 0 ? categories[0].id : (undefined as any),
    });
    setEditorTab('edit');
    setIsGuideOpen(true);
  };

  const handleOpenEditGuide = (guide: any) => {
    setSelectedGuide(guide);
    guideForm.reset({
      title: guide.title,
      description: guide.description || '',
      content: guide.content,
      coverImage: guide.coverImage || '',
      videoUrl: guide.videoUrl || '',
      helpId: guide.helpId || '',
      order: guide.order || 0,
      categoryId: guide.category?.id,
    });
    setEditorTab('edit');
    setIsGuideOpen(true);
  };

  const onSubmitGuide = async (values: any) => {
    try {
      if (selectedGuide) {
        await api.patch(`/guides/${selectedGuide.id}`, values);
        toast.success('راهنما با موفقیت ویرایش شد');
      } else {
        await api.post('/guides', values);
        toast.success('راهنما با موفقیت ایجاد شد');
      }
      setIsGuideOpen(false);
      mutateGuides();
      mutateCategories(); // Mutate categories to update guides count
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(code || 'خطایی در ثبت اطلاعات رخ داد');
    }
  };

  const handleDeleteGuide = async (id: number) => {
    if (!confirm('آیا از حذف این راهنما اطمینان دارید؟')) return;
    try {
      await api.delete(`/guides/${id}`);
      toast.success('راهنما با موفقیت حذف شد');
      mutateGuides();
      mutateCategories();
    } catch (err: any) {
      toast.error('حذف راهنما با خطا مواجه شد');
    }
  };

  // CRUD actions for Category
  const handleOpenAddCategory = () => {
    setSelectedCategory(null);
    categoryForm.reset({
      name: '',
      order: 0,
    });
    setIsCategoryOpen(true);
  };

  const handleOpenEditCategory = (category: any) => {
    setSelectedCategory(category);
    categoryForm.reset({
      name: category.name,
      order: category.order || 0,
    });
    setIsCategoryOpen(true);
  };

  const onSubmitCategory = async (values: any) => {
    try {
      if (selectedCategory) {
        await api.patch(`/guides/categories/${selectedCategory.id}`, values);
        toast.success('دسته‌بندی با موفقیت ویرایش شد');
      } else {
        await api.post('/guides/categories', values);
        toast.success('دسته‌بندی با موفقیت ایجاد شد');
      }
      setIsCategoryOpen(false);
      mutateCategories();
      mutateGuides();
    } catch (err: any) {
      toast.error('ثبت دسته‌بندی با خطا مواجه شد');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (
      !confirm(
        'با حذف این دسته‌بندی، تمامی راهنماهای زیرمجموعه آن نیز حذف خواهند شد. آیا مطمئن هستید؟',
      )
    )
      return;
    try {
      await api.delete(`/guides/categories/${id}`);
      toast.success('دسته‌بندی با موفقیت حذف شد');
      mutateCategories();
      mutateGuides();
    } catch (err: any) {
      toast.error('حذف دسته‌بندی با خطا مواجه شد');
    }
  };

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex h-full flex-col gap-6 overflow-y-auto p-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">مدیریت راهنماها و آموزش‌ها</h1>
            <p className="mt-1 text-sm text-slate-500">
              در این بخش می‌توانید دسته‌بندی‌ها و مقالات راهنمای پنل کاربران را مدیریت کنید.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleOpenAddCategory}
              variant="outline"
              className="flex items-center gap-1"
            >
              <Plus size={16} /> افزودن دسته‌بندی
            </Button>
            <Button onClick={handleOpenAddGuide} className="flex items-center gap-1">
              <Plus size={16} /> افزودن راهنما
            </Button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Categories Panel */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 border-b pb-2 font-semibold text-slate-800">
              <FileText size={18} className="text-slate-500" /> دسته‌بندی‌ها
            </h2>
            {categories.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">هیچ دسته‌بندی‌ای یافت نشد.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-all hover:bg-slate-50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">{category.name}</span>
                      <span className="mt-0.5 text-xs text-slate-400">
                        ترتیب: {category.order} | {category.guides?.length || 0} راهنما
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-500 hover:text-slate-700"
                        onClick={() => handleOpenEditCategory(category)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guides Panel */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-xs lg:col-span-2">
            <h2 className="flex items-center gap-2 border-b pb-2 font-semibold text-slate-800">
              <HelpCircle size={18} className="text-slate-500" /> مقالات راهنما
            </h2>
            {guides.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">هیچ مقاله‌ای یافت نشد.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {guides.map((guide) => (
                  <div
                    key={guide.id}
                    className="flex items-start justify-between rounded-xl border border-slate-100 p-4 transition-all hover:border-slate-200"
                  >
                    <div className="flex max-w-[80%] flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-slate-800">{guide.title}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {guide.category?.name || 'بدون دسته‌بندی'}
                        </span>
                        {guide.helpId && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-600">
                            {guide.helpId}
                          </span>
                        )}
                      </div>
                      {guide.description && (
                        <p className="line-clamp-2 text-sm text-slate-500">{guide.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>ترتیب: {guide.order}</span>
                        {guide.videoUrl && (
                          <span className="font-medium text-green-600">دارای ویدیو اصلی</span>
                        )}
                        {guide.coverImage && <span>دارای تصویر کاور</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-slate-600 hover:bg-slate-50"
                        onClick={() => handleOpenEditGuide(guide)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteGuide(guide.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">
              {selectedCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی'}
            </DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel>نام دسته‌بندی</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: اتوماسیون و ربات" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="order"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel>ترتیب نمایش (هرچه کوچکتر بالاتر)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        onInput={onInputP2EHandler}
                        placeholder="0"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? 0 : +e.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsCategoryOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit">
                  {selectedCategory ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Guide Dialog (Large size for editor) */}
      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">
              {selectedGuide ? 'ویرایش راهنما' : 'افزودن راهنمای جدید'}
            </DialogTitle>
          </DialogHeader>
          <Form {...guideForm}>
            <form onSubmit={guideForm.handleSubmit(onSubmitGuide)} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={guideForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel>عنوان راهنما</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: نحوه اتصال اینستاگرام" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={guideForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel>دسته‌بندی مربوطه</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(+val)}
                        value={field.value !== undefined ? String(field.value) : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="یک دسته‌بندی انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={guideForm.control}
                  name="helpId"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel>شناسه راهنما (Help ID - اختیاری)</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === 'none' ? '' : val)}
                        value={field.value || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب شناسه راهنما" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">بدون شناسه راهنما (راهنمای عمومی)</SelectItem>
                          <SelectItem value="connect_instagram">
                            اتصال اینستاگرام (صفحه اتصال)
                          </SelectItem>
                          <SelectItem value="connect_instagram_invalid">
                            اتصال اینستاگرام نامعتبر (دیالوگ خطا)
                          </SelectItem>
                          <SelectItem value="automation_triggers">
                            اتوماسیون - شروع‌کننده‌ها (Triggers)
                          </SelectItem>
                          <SelectItem value="automation_comment_triggers">
                            اتوماسیون - متن شروع کامنت (Consent)
                          </SelectItem>
                          <SelectItem value="automation_comment_replies">
                            اتوماسیون - پاسخ به کامنت‌ها
                          </SelectItem>
                          <SelectItem value="automation_just_followers">
                            اتوماسیون - فقط فالوورها
                          </SelectItem>
                          <SelectItem value="automation_reminders">
                            اتوماسیون - یادآوری‌ها (Reminders)
                          </SelectItem>
                          <SelectItem value="automation_conditions">
                            اتوماسیون - شرط‌ها (Conditions)
                          </SelectItem>
                          <SelectItem value="automation_contents">
                            اتوماسیون - محتوای ربات (Contents)
                          </SelectItem>
                          <SelectItem value="dashboard_general_help">
                            داشبورد - ویدیو راهنمای کلی خانه
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={guideForm.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel>ترتیب نمایش (هرچه کوچکتر بالاتر)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          onInput={onInputP2EHandler}
                          placeholder="0"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? 0 : +e.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={guideForm.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel>ویدیو اصلی (تا ۱ گیگابایت)</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById('cover-video-upload-file')?.click()
                          }
                          disabled={videoUploading}
                          className="shrink-0 text-xs"
                        >
                          {videoUploading ? `آپلود ${videoProgress}%` : 'آپلود ویدیو'}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={guideForm.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel>تصویر کاور ویدیو (تا ۳ مگابایت)</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById('cover-image-upload-file')?.click()
                          }
                          disabled={coverUploading}
                          className="shrink-0 text-xs"
                        >
                          {coverUploading ? `آپلود ${coverProgress}%` : 'آپلود تصویر'}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={guideForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel>توضیح کوتاه / خلاصه (اختیاری)</FormLabel>
                      <FormControl>
                        <Input placeholder="توضیح مختصری درباره این آموزش..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Rich Markdown Editor */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/20">
                {/* Editor Header / Tab switcher */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-2">
                  <div className="flex gap-1 rounded-lg bg-slate-200/60 p-0.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={editorTab === 'edit' ? 'default' : 'ghost'}
                      className="h-8 text-xs font-semibold"
                      onClick={() => setEditorTab('edit')}
                    >
                      <Edit size={14} className="ml-1" /> ویرایشگر
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editorTab === 'preview' ? 'default' : 'ghost'}
                      className="h-8 text-xs font-semibold"
                      onClick={() => setEditorTab('preview')}
                    >
                      <Eye size={14} className="ml-1" /> پیش‌نمایش
                    </Button>
                  </div>

                  {/* Toolbar - Visible only in edit mode */}
                  {editorTab === 'edit' && (
                    <div className="flex items-center gap-1 overflow-x-auto pl-2 select-none">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600"
                        title="ضخیم (Bold)"
                        onClick={() => insertText('**', '**')}
                      >
                        <Bold size={15} />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600"
                        title="مورب (Italic)"
                        onClick={() => insertText('*', '*')}
                      >
                        <Italic size={15} />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600"
                        title="تیتر ۱"
                        onClick={() => insertText('# ')}
                      >
                        <Heading1 size={15} />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600"
                        title="تیتر ۲"
                        onClick={() => insertText('## ')}
                      >
                        <Heading2 size={15} />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600"
                        title="لیست نشانه‌دار"
                        onClick={() => insertText('- ')}
                      >
                        <List size={15} />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600"
                        title="نقل قول"
                        onClick={() => insertText('> ')}
                      >
                        <Quote size={15} />
                      </Button>

                      <div className="mx-1 h-4 w-px bg-slate-300" />

                      {/* Colors */}
                      <div className="relative">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-600"
                          title="انتخاب رنگ متن"
                          onClick={() => setColorPopoverOpen(!colorPopoverOpen)}
                        >
                          <Palette size={15} />
                        </Button>
                        {colorPopoverOpen && (
                          <div className="absolute top-9 left-0 z-50 flex gap-1.5 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                            <button
                              type="button"
                              className="h-5 w-5 rounded-full bg-red-500 duration-75 hover:scale-110"
                              onClick={() => handleInsertColor('#ef4444')}
                              title="قرمز"
                            />
                            <button
                              type="button"
                              className="h-5 w-5 rounded-full bg-blue-500 duration-75 hover:scale-110"
                              onClick={() => handleInsertColor('#3b82f6')}
                              title="آبی"
                            />
                            <button
                              type="button"
                              className="h-5 w-5 rounded-full bg-green-500 duration-75 hover:scale-110"
                              onClick={() => handleInsertColor('#10b981')}
                              title="سبز"
                            />
                            <button
                              type="button"
                              className="h-5 w-5 rounded-full bg-amber-500 duration-75 hover:scale-110"
                              onClick={() => handleInsertColor('#f59e0b')}
                              title="نارنجی"
                            />
                            <button
                              type="button"
                              className="h-5 w-5 rounded-full bg-purple-500 duration-75 hover:scale-110"
                              onClick={() => handleInsertColor('#8b5cf6')}
                              title="بنفش"
                            />
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600"
                        title="افزودن لینک"
                        onClick={handleInsertLink}
                      >
                        <LinkIcon size={15} />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600"
                        title="افزودن تصویر"
                        onClick={handleInsertImage}
                      >
                        <ImageIcon size={15} />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600"
                        title="افزودن ویدیو"
                        onClick={handleInsertVideo}
                      >
                        <VideoIcon size={15} />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Editor Content Area */}
                <div className="min-h-[300px] p-1">
                  {editorTab === 'edit' ? (
                    <FormField
                      control={guideForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem className="h-full">
                          <FormControl>
                            <textarea
                              {...field}
                              ref={(e) => {
                                field.ref(e);
                                (textareaRef as any).current = e;
                              }}
                              className="h-[320px] w-full resize-y border-0 bg-transparent p-4 text-right font-mono text-sm leading-relaxed outline-hidden focus:ring-0 focus-visible:ring-0"
                              placeholder="محتوای مقاله آموزشی را با قالب‌بندی مارک‌داون اینجا بنویسید..."
                              dir="rtl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div
                      className="max-h-[500px] min-h-[320px] w-full overflow-y-auto bg-white p-5 text-right leading-relaxed"
                      dir="rtl"
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdownToHtml(guideForm.watch('content')),
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsGuideOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit">{selectedGuide ? 'ذخیره تغییرات' : 'ایجاد راهنما'}</Button>
              </div>

              {/* Hidden S3 File Upload Triggers */}
              <input
                type="file"
                id="cover-image-upload-file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadImage(file, 'cover');
                }}
              />
              <input
                type="file"
                id="cover-video-upload-file"
                className="hidden"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadVideo(file, 'video');
                }}
              />
              <input
                type="file"
                id="editor-image-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadImage(file, 'editor');
                }}
              />
              <input
                type="file"
                id="editor-video-upload"
                className="hidden"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadVideo(file, 'editor');
                }}
              />
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </LayoutTable>
  );
}
