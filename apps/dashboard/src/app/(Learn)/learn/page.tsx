// src/app/(Learn)/learn/page.tsx
'use client';

import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { fetcher } from '@/hooks/swr/api-client';
import { cn } from '@/lib/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import Link from 'next/link';
import React, { useState, Suspense } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui';
import {
  BookOpenIcon,
  PlayCircleIcon,
  CaretLeftIcon,
  CaretRightIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react';
import { AutoAspectPlayer } from '@/components/Global/HelpMeDialog';

// Helper for parsing Markdown to HTML
function parseMarkdownToHtml(markdown: string): string {
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
  html = html.replace(
    /^# (.*?)$/gm,
    '<h1 class="text-xl md:text-2xl font-black my-5 text-slate-800 border-b pb-2 border-slate-100">$1</h1>',
  );
  html = html.replace(
    /^## (.*?)$/gm,
    '<h2 class="text-lg md:text-xl font-bold my-4 text-slate-800 border-b pb-1 border-slate-50">$1</h2>',
  );
  html = html.replace(
    /^### (.*?)$/gm,
    '<h3 class="text-base md:text-lg font-bold my-3 text-slate-800">$1</h3>',
  );

  // Bold / Italic
  html = html.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-extrabold text-slate-900">$1</strong>',
  );
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>');

  // Code block
  html = html.replace(
    /```([\s\S]*?)```/g,
    '<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-sm overflow-auto my-4 shadow-inner" dir="ltr">$1</pre>',
  );

  // Inline code
  html = html.replace(
    /`(.*?)`/g,
    '<code class="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-xs" dir="ltr">$1</code>',
  );

  // Blockquote
  html = html.replace(
    /^&gt; (.*?)$/gm,
    '<blockquote class="border-r-4 border-blue-500 pr-4 pl-2 py-2 bg-blue-50/40 rounded-l-lg my-4 italic text-slate-600">$1</blockquote>',
  );

  // Controlled Image sizes inside learning articles (max width 28rem/md centered)
  html = html.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    '<img src="$2" alt="$1" class="rounded-2xl max-w-full md:max-w-md mx-auto block my-6 shadow-md border border-slate-200/50 object-contain hover:scale-[1.01] duration-300 transition-transform" />',
  );

  // Links
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" class="text-blue-600 hover:underline hover:text-blue-800 font-semibold transition-colors">$1</a>',
  );

  // Lists
  html = html.replace(
    /^\s*-\s+(.*?)$/gm,
    '<li class="list-disc list-inside mr-4 my-1.5 text-slate-700">$1</li>',
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
    return `<p class="my-2.5 leading-relaxed text-slate-600 text-sm md:text-base">${line}</p>`;
  });

  return processedLines.join('\n');
}

// Custom pagination component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-8 flex items-center justify-center gap-1.5" dir="rtl">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="shadow-3xs cursor-pointer rounded-xl border border-slate-200 bg-white disabled:opacity-50"
      >
        <CaretRightIcon size={16} />
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? 'default' : 'ghost'}
          onClick={() => onPageChange(page)}
          className={cn(
            'shadow-3xs h-10 w-10 cursor-pointer rounded-xl text-sm font-bold',
            currentPage === page
              ? 'border border-slate-900 bg-slate-900 text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="shadow-3xs cursor-pointer rounded-xl border border-slate-200 bg-white disabled:opacity-50"
      >
        <CaretLeftIcon size={16} />
      </Button>
    </div>
  );
}

function LearnContent() {
  const t = useTranslations('Learn');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL search params
  const categoryIdParam = searchParams.get('category');

  // SWR categories and guides
  const { data: categoriesRes, isLoading } = useSWR('/guides', fetcher);
  const categories = categoriesRes?.data || [];

  // Local states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleOpenGuide = (guide: any) => {
    setSelectedGuide(guide);
    setIsDialogOpen(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleCategoryClick = (catId: string) => {
    setCurrentPage(1);
    if (catId === 'all') {
      router.push('/learn');
    } else {
      router.push(`/learn?category=${catId}`);
    }
  };

  // 1. Search Query Filter Mode
  if (searchQuery.trim().length > 0) {
    const query = searchQuery.toLowerCase().trim();
    // Gather all matching guides across categories
    const allGuides: any[] = [];
    categories.forEach((cat: any) => {
      (cat.guides || []).forEach((g: any) => {
        if (
          g.title?.toLowerCase().includes(query) ||
          g.description?.toLowerCase().includes(query) ||
          g.content?.toLowerCase().includes(query)
        ) {
          allGuides.push({ ...g, categoryName: cat.name });
        }
      });
    });

    const itemsPerPage = 6;
    const totalPages = Math.ceil(allGuides.length / itemsPerPage);
    const paginatedGuides = allGuides.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );

    return (
      <div
        className="scrollbar-thin relative flex h-full flex-col overflow-y-auto rounded-t-3xl bg-slate-50/50 p-5 select-none md:h-[calc(100vh-88px)] md:rounded-t-none md:p-8"
        style={{
          backgroundImage:
            'radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 450px), radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.04), transparent 400px), radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '100% 100%, 100% 100%, 20px 20px',
          backgroundColor: '#f8fafc',
        }}
        dir="rtl"
      >
        {/* Search Bar Block */}
        <div className="z-10 mx-auto mb-6 w-full max-w-6xl">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="جستجو در مقالات و راهنماها..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="shadow-3xs w-full rounded-2xl border border-slate-200 bg-white py-3 pr-11 pl-10 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-hidden"
            />
            <MagnifyingGlassIcon className="absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <button
              onClick={handleClearSearch}
              className="absolute top-1/2 left-3 h-6 w-6 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
            >
              <XCircleIcon size={20} weight="fill" />
            </button>
          </div>
        </div>

        {/* Search Header */}
        <div className="z-10 mx-auto mb-8 flex w-full max-w-6xl items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-800">
            نتایج جستجو برای: <span className="text-blue-600">«{searchQuery}»</span>
          </h2>
          <Button
            variant="ghost"
            onClick={handleClearSearch}
            className="border-red-150 rounded-xl border text-xs font-bold text-red-500 hover:bg-red-50/50"
          >
            پاک کردن جستجو
          </Button>
        </div>

        <div className="z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
          {allGuides.length === 0 ? (
            <div className="shadow-3xs rounded-3xl border border-slate-200/50 bg-white/70 py-20 text-center text-slate-400 backdrop-blur-xs">
              هیچ آموزشی متناسب با عبارت مورد نظر یافت نشد.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {paginatedGuides.map((guide) => (
                  <div
                    key={guide.id}
                    onClick={() => handleOpenGuide(guide)}
                    className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-[0_4px_20px_-4px_rgba(148,163,184,0.06)] backdrop-blur-xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-[0_12px_24px_-8px_rgba(59,130,246,0.12)]"
                  >
                    <div className="flex flex-col gap-3">
                      {guide.coverImage ? (
                        <div className="relative mb-1 aspect-video w-full overflow-hidden rounded-xl border border-slate-100/50 bg-slate-100">
                          <img
                            src={guide.coverImage}
                            alt={guide.title}
                            className="h-full w-full object-cover"
                          />
                          {guide.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-90">
                              <PlayCircleIcon className="h-12 w-12 text-white" weight="fill" />
                            </div>
                          )}
                        </div>
                      ) : (
                        guide.videoUrl && (
                          <div className="relative mb-1 flex aspect-video w-full items-center justify-center rounded-xl border border-blue-100/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                            <PlayCircleIcon
                              className="h-12 w-12 text-blue-500/80"
                              weight="duotone"
                            />
                          </div>
                        )
                      )}
                      <h3 className="line-clamp-1 text-sm font-extrabold text-slate-800 group-hover:text-blue-600 md:text-base">
                        {guide.title}
                      </h3>
                      {guide.description && (
                        <p className="line-clamp-2 text-xs leading-relaxed font-medium text-slate-400">
                          {guide.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100/60 pt-3 text-xs font-semibold text-slate-400">
                      <span>دسته‌بندی: {guide.categoryName}</span>
                      <span className="flex items-center gap-0.5 font-bold text-blue-600">
                        مشاهده راهنما
                        <CaretLeftIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>

        {/* Dialog details */}
        {renderDetailDialog()}
      </div>
    );
  }

  // Helper rendering guide details dialog
  function renderDetailDialog() {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedGuide && (
          <DialogContent
            className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl border-slate-200/80 bg-white p-0 shadow-2xl"
            dir="rtl"
          >
            <div className="flex flex-col">
              {selectedGuide.videoUrl ? (
                <div className="flex items-center justify-center rounded-t-3xl border-b border-slate-100 bg-slate-50/30 p-5 md:p-6">
                  <AutoAspectPlayer
                    src={selectedGuide.videoUrl}
                    poster={selectedGuide.coverImage}
                  />
                </div>
              ) : (
                selectedGuide.coverImage && (
                  <div className="relative h-48 w-full overflow-hidden rounded-t-3xl border-b border-slate-100 md:h-64">
                    <img
                      src={selectedGuide.coverImage}
                      alt={selectedGuide.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )
              )}
              <div className="flex flex-col gap-4 p-6 text-right md:p-8">
                <div className="flex flex-col gap-1 border-b border-slate-100/80 pb-4">
                  <h2 className="text-xl font-black text-slate-800 md:text-2xl">
                    {selectedGuide.title}
                  </h2>
                  {selectedGuide.category && (
                    <span className="mt-1 text-xs font-semibold text-slate-400">
                      دسته‌بندی: {selectedGuide.category.name}
                    </span>
                  )}
                </div>
                <div
                  className="prose max-w-none border-0 text-sm leading-relaxed text-slate-700 outline-hidden md:text-base"
                  dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(selectedGuide.content) }}
                />
              </div>
              <DialogFooter className="flex justify-end rounded-b-3xl border-t border-slate-100 bg-slate-50/50 p-4">
                <Button onClick={() => setIsDialogOpen(false)} className="w-[120px] font-bold">
                  {t('close') || 'بستن'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>
    );
  }

  // 2. Single Category Full View (when categoryIdParam is set)
  if (categoryIdParam) {
    const activeCategoryObj = categories.find((cat: any) => String(cat.id) === categoryIdParam);
    const categoryGuides = activeCategoryObj?.guides || [];

    const itemsPerPage = 6;
    const totalPages = Math.ceil(categoryGuides.length / itemsPerPage);
    const paginatedGuides = categoryGuides.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );

    return (
      <div
        className="scrollbar-thin relative flex h-full flex-col overflow-y-auto rounded-t-3xl bg-slate-50/50 p-5 select-none md:h-[calc(100vh-88px)] md:rounded-t-none md:p-8"
        style={{
          backgroundImage:
            'radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 450px), radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.04), transparent 400px), radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '100% 100%, 100% 100%, 20px 20px',
          backgroundColor: '#f8fafc',
        }}
        dir="rtl"
      >
        {/* Breadcrumb Back Button */}
        <div className="z-10 mb-6 flex w-full items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => handleCategoryClick('all')}
            className="shadow-3xs gap-2 rounded-xl border border-slate-200/50 bg-white/70 font-bold text-slate-600 transition-all hover:bg-white hover:text-slate-900"
          >
            <ArrowRightIcon className="ml-1 h-4 w-4" />
            بازگشت به خانه آموزش‌ها
          </Button>
        </div>

        {/* Category Header */}
        <div className="shadow-3xs z-10 mx-auto mb-8 w-full max-w-6xl rounded-3xl border border-slate-200/60 bg-white/70 p-6 text-right backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-6 w-2 rounded-full bg-blue-600" />
            <h1 className="text-xl font-black text-slate-800 md:text-2xl">
              آموزش‌های دسته‌بندی: {activeCategoryObj?.name || 'نامشخص'}
            </h1>
          </div>
          <p className="mt-2 text-xs font-medium text-slate-400 md:text-sm">
            مجموعاً {categoryGuides.length} مقاله و راهنمای آموزشی در این بخش وجود دارد.
          </p>
        </div>

        <div className="z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
          {categoryGuides.length === 0 ? (
            <div className="shadow-3xs rounded-3xl border border-slate-200/50 bg-white/70 py-20 text-center text-slate-400 backdrop-blur-xs">
              هیچ آموزشی در این دسته‌بندی وجود ندارد.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {paginatedGuides.map((guide: any) => (
                  <div
                    key={guide.id}
                    onClick={() => handleOpenGuide(guide)}
                    className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-[0_4px_20px_-4px_rgba(148,163,184,0.06)] backdrop-blur-xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-[0_12px_24px_-8px_rgba(59,130,246,0.12)]"
                  >
                    <div className="flex flex-col gap-3">
                      {guide.coverImage ? (
                        <div className="relative mb-1 aspect-video w-full overflow-hidden rounded-xl border border-slate-100/50 bg-slate-100">
                          <img
                            src={guide.coverImage}
                            alt={guide.title}
                            className="h-full w-full object-cover"
                          />
                          {guide.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-90">
                              <PlayCircleIcon className="h-12 w-12 text-white" weight="fill" />
                            </div>
                          )}
                        </div>
                      ) : (
                        guide.videoUrl && (
                          <div className="relative mb-1 flex aspect-video w-full items-center justify-center rounded-xl border border-blue-100/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                            <PlayCircleIcon
                              className="h-12 w-12 text-blue-500/80"
                              weight="duotone"
                            />
                          </div>
                        )
                      )}
                      <h3 className="line-clamp-1 text-sm font-extrabold text-slate-800 group-hover:text-blue-600 md:text-base">
                        {guide.title}
                      </h3>
                      {guide.description && (
                        <p className="line-clamp-2 text-xs leading-relaxed font-medium text-slate-400">
                          {guide.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100/60 pt-3 text-xs font-semibold text-slate-400">
                      <span>{guide.videoUrl ? 'آموزش ویدیویی' : 'آموزش متنی'}</span>
                      <span className="flex items-center gap-0.5 font-bold text-blue-600">
                        مشاهده راهنما
                        <CaretLeftIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>

        {renderDetailDialog()}
      </div>
    );
  }

  // 3. Categories List Mode (Categories Paginated, each showing up to 3 previews)
  const categoriesPerPage = 3;
  const totalCategoriesPages = Math.ceil(categories.length / categoriesPerPage);
  const paginatedCategories = categories.slice(
    (currentPage - 1) * categoriesPerPage,
    currentPage * categoriesPerPage,
  );

  return (
    <div
      className="scrollbar-thin relative flex h-full flex-col overflow-y-auto rounded-t-3xl bg-slate-50/50 p-5 select-none md:h-[calc(100vh-88px)] md:rounded-t-none md:p-8"
      style={{
        backgroundImage:
          'radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 450px), radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.04), transparent 400px), radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '100% 100%, 100% 100%, 20px 20px',
        backgroundColor: '#f8fafc',
      }}
      dir="rtl"
    >
      {pathname === '/learn' && (
        <div className="z-10 mb-4 flex w-full justify-end md:mb-6">
          <Button
            variant="ghost"
            asChild
            className="shadow-3xs gap-2 rounded-xl border border-slate-100 bg-white/60 text-slate-500 transition-all hover:border-slate-200 hover:bg-white hover:text-slate-900"
          >
            <Link href="/">
              <CaretLeftIcon className="ml-1 h-4 w-4" />
              {t('enter_panel')}
            </Link>
          </Button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative z-10 mx-auto mb-6 w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 p-6 text-right shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-md md:p-8">
        <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />

        <h1 className="flex items-center gap-3 text-2xl font-black text-slate-800 md:text-3xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-600 shadow-2xs">
            <BookOpenIcon className="h-6 w-6" weight="duotone" />
          </div>
          {t('title') || 'مرکز راهنما و آموزش'}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed font-medium text-slate-500 md:text-base">
          {t('subtitle') ||
            'پاسخ سوالات شما، راهنماهای گام‌به‌گام و ویدیوهای کوتاه آموزشی اتصال ربات و هوشمندسازی اینستاگرام.'}
        </p>
      </div>

      {/* Search Bar Panel */}
      <div className="z-10 mx-auto mb-6 w-full max-w-6xl">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="جستجو در مقالات و راهنماها..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="shadow-3xs w-full rounded-2xl border border-slate-200 bg-white py-3 pr-11 pl-4 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-hidden"
          />
          <MagnifyingGlassIcon className="absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
        {/* Category Navigation Tabs (X-Scrollable) */}
        {categories.length > 0 && (
          <div className="scrollbar-none flex max-w-full items-center gap-2 overflow-x-auto border-b border-slate-200/50 pb-3 select-none">
            <button
              onClick={() => handleCategoryClick('all')}
              className="shadow-3xs cursor-pointer rounded-2xl border border-slate-900 bg-slate-900 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white hover:bg-slate-800"
            >
              همه آموزش‌ها
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(String(cat.id))}
                className="shadow-3xs cursor-pointer rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-slate-600 backdrop-blur-xs hover:border-slate-300 hover:bg-white hover:text-slate-950"
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Content Section (Categories lists with arrows for pagination) */}
        {categories.length === 0 ? (
          <div className="shadow-3xs rounded-3xl border border-dashed border-slate-200 bg-white/70 py-20 text-center text-slate-400 backdrop-blur-xs">
            هیچ مطلبی یافت نشد.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {paginatedCategories.map((category: any) => {
              const categoryGuides = category.guides || [];
              if (categoryGuides.length === 0) return null;

              // Preview first 3 guides
              const previewGuides = categoryGuides.slice(0, 3);
              const showArrow = categoryGuides.length > 3;

              return (
                <div key={category.id} className="flex flex-col gap-4">
                  {/* Category Title with Arrow Linking to full page */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-1.5 rounded-full bg-blue-600" />
                      <h2 className="text-lg font-black text-slate-800">{category.name}</h2>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-400">
                        {categoryGuides.length} آموزش
                      </span>
                    </div>

                    {/* View All Arrow (points left in RTL) */}
                    <button
                      onClick={() => handleCategoryClick(String(category.id))}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-100/40 bg-blue-50/50 px-3 py-1.5 text-xs font-bold text-blue-600 select-none hover:bg-blue-50 hover:text-blue-800"
                    >
                      مشاهده همه
                      <CaretLeftIcon size={14} className="animate-pulse" />
                    </button>
                  </div>

                  {/* Guides Preview Grid */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {previewGuides.map((guide: any) => (
                      <div
                        key={guide.id}
                        onClick={() => handleOpenGuide(guide)}
                        className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-[0_4px_20px_-4px_rgba(148,163,184,0.06)] backdrop-blur-xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-[0_12px_24px_-8px_rgba(59,130,246,0.12)]"
                      >
                        <div className="flex flex-col gap-3">
                          {guide.coverImage ? (
                            <div className="relative mb-1 aspect-video w-full overflow-hidden rounded-xl border border-slate-100/50 bg-slate-100">
                              <img
                                src={guide.coverImage}
                                alt={guide.title}
                                className="h-full w-full object-cover"
                              />
                              {guide.videoUrl && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-90">
                                  <PlayCircleIcon className="h-12 w-12 text-white" weight="fill" />
                                </div>
                              )}
                            </div>
                          ) : (
                            guide.videoUrl && (
                              <div className="relative mb-1 flex aspect-video w-full items-center justify-center rounded-xl border border-blue-100/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                                <PlayCircleIcon
                                  className="h-12 w-12 text-blue-500/80"
                                  weight="duotone"
                                />
                              </div>
                            )
                          )}
                          <h3 className="line-clamp-1 text-sm font-extrabold text-slate-800 group-hover:text-blue-600 md:text-base">
                            {guide.title}
                          </h3>
                          {guide.description && (
                            <p className="line-clamp-2 text-xs leading-relaxed font-medium text-slate-400">
                              {guide.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100/60 pt-3 text-xs font-semibold text-slate-400">
                          <span>{guide.videoUrl ? 'آموزش ویدیویی' : 'آموزش متنی'}</span>
                          <span className="flex items-center gap-0.5 font-bold text-blue-600 transition-transform duration-300 group-hover:translate-x-[-2px]">
                            مشاهده راهنما
                            <CaretLeftIcon className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <Pagination
              currentPage={currentPage}
              totalPages={totalCategoriesPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {renderDetailDialog()}
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-[400px] items-center justify-center bg-slate-50/40 p-8">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        </div>
      }
    >
      <LearnContent />
    </Suspense>
  );
}
