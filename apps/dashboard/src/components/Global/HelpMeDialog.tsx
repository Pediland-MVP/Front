// src/components/Global/HelpMeDialog.tsx
'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import React, { ReactNode, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/hooks/swr/api-client';
import { escapeMarkdownHtml, sanitizeUrl } from '@befroosh/ui/lib/markdown';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { MonitorPlayIcon, X } from 'lucide-react';

type Position =
  | 'left'
  | 'left-top'
  | 'left-bottom'
  | 'right'
  | 'right-top'
  | 'right-bottom'
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

interface HelpDialogProps {
  title: string;
  description?: string;
  videoSrc?: string;
  videoPoster?: string;
  position?: Position;
  className?: string;
  noAbsolute?: boolean;
  children?: ReactNode;
  helpId?: string;
}

const getPositionClasses = (position: Position, noAbsolute: boolean = false): string => {
  const positions = {
    left: 'absolute left-0 top-1/2 -translate-y-1/2',
    'left-top': 'absolute left-0 top-2',
    'left-bottom': 'absolute left-2 bottom-2',
    right: 'absolute right-2 top-1/2 -translate-y-1/2',
    'right-top': 'absolute right-2 top-2',
    'right-bottom': 'absolute right-2 bottom-2',
    top: 'absolute top-2 left-1/2 -translate-x-1/2',
    'top-left': 'absolute top-2 left-2',
    'top-right': 'absolute top-2 right-2',
    bottom: 'absolute bottom-2 left-1/2 -translate-x-1/2',
    'bottom-left': 'absolute bottom-2 left-2',
    'bottom-right': 'absolute bottom-2 right-2',
    center: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  if (!noAbsolute) {
    return positions[position] || positions['right-top'];
  }

  return '';
};

// Auto-detecting video player aspect ratio
export const AutoAspectPlayer = ({ src, poster }: { src: string; poster?: string }) => {
  const [aspect, setAspect] = useState<'video' | 'square' | 'vertical'>('video');

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const width = video.videoWidth;
    const height = video.videoHeight;
    const ratio = width / height;

    if (ratio < 0.75) {
      setAspect('vertical'); // Reel size 9:16
    } else if (ratio >= 0.75 && ratio <= 1.25) {
      setAspect('square'); // Square size 1:1
    } else {
      setAspect('video'); // Youtube size 16:9
    }
  };

  return (
    <div
      className={cn(
        'relative mx-auto my-4 flex w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200/50 bg-slate-950 shadow-md transition-all duration-300',
        aspect === 'vertical' && 'aspect-[9/16] h-[550px] max-w-[340px] md:h-[600px]',
        aspect === 'square' && 'aspect-square max-w-[360px] md:h-[360px]',
        aspect === 'video' && 'aspect-video max-h-[380px] w-full',
      )}
    >
      <video
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
        onLoadedMetadata={handleLoadedMetadata}
      />
    </div>
  );
};

// Helper for parsing simple Markdown to HTML inside popovers
function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  let html = escapeMarkdownHtml(markdown);

  // Restore allowed span tags for colors (like <span style="color: ...">...</span>)
  html = html.replace(
    /&lt;span\s+style=&quot;color:\s*(#[0-9a-fA-F]{3,6}|[a-zA-Z]+);?&quot;&gt;([\s\S]*?)&lt;\/span&gt;/gi,
    (_match, color, content) => {
      return `<span style="color: ${color}">${content}</span>`;
    },
  );

  // Headers
  html = html.replace(
    /^# (.*?)$/gm,
    '<h1 class="text-base md:text-lg font-black my-4 text-slate-800 border-b pb-1.5 border-slate-100">$1</h1>',
  );
  html = html.replace(
    /^## (.*?)$/gm,
    '<h2 class="text-sm md:text-base font-bold my-3 text-slate-800">$1</h2>',
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
    '<pre class="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs overflow-auto my-3" dir="ltr">$1</pre>',
  );

  // Inline code
  html = html.replace(
    /`(.*?)`/g,
    '<code class="bg-slate-100 text-pink-600 px-1 rounded font-mono text-xs">$1</code>',
  );

  // Blockquote
  html = html.replace(
    /^&gt; (.*?)$/gm,
    '<blockquote class="border-r-4 border-blue-500 pr-3 pl-1 py-1 bg-slate-50 rounded-l-md my-3 italic text-slate-600">$1</blockquote>',
  );

  // Controlled Image sizes
  html = html.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    (_match, alt, url) =>
      `<img src="${sanitizeUrl(url)}" alt="${alt}" class="rounded-xl max-w-full md:max-w-sm mx-auto block my-5 shadow-sm border border-slate-200/50 object-contain hover:scale-[1.01] duration-300 transition-transform" />`,
  );

  // Links
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    (_match, text, url) =>
      `<a href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline font-semibold">${text}</a>`,
  );

  // Lists
  html = html.replace(
    /^\s*-\s+(.*?)$/gm,
    '<li class="list-disc list-inside mr-3 my-1 text-slate-700">$1</li>',
  );

  // Paragraph lines
  const lines = html.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('<blockquote') ||
      trimmed.startsWith('<p') ||
      trimmed.startsWith('<img')
    ) {
      return line;
    }
    return `<p class="my-2 leading-relaxed text-slate-600 text-xs md:text-sm">${line}</p>`;
  });

  return processedLines.join('\n');
}

export const HelpMeDialog = ({
  title,
  description,
  videoSrc,
  videoPoster,
  position = 'right-top',
  className,
  noAbsolute = false,
  children,
  helpId,
}: HelpDialogProps) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations('Helpme');

  // Fetch dynamic guide if helpId is supplied
  const { data: guideRes } = useSWR(helpId ? `/guides/${helpId}` : null, fetcher);
  const dynamicGuide = guideRes?.data;

  // Resolve values (fallback to hardcoded props if backend guide doesn't exist)
  const resolvedTitle = dynamicGuide?.title || title;
  const resolvedDescription = dynamicGuide?.description || description;
  const resolvedVideoSrc = dynamicGuide?.videoUrl || videoSrc;
  const resolvedVideoPoster = dynamicGuide?.coverImage || videoPoster;
  const resolvedContent = dynamicGuide?.content || '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <span
            className={cn(
              noAbsolute ? '' : getPositionClasses(position),
              className,
              'mx-0.5 inline-block cursor-pointer text-[10px] font-bold whitespace-nowrap text-blue-500 transition-colors select-none hover:text-blue-700 hover:underline md:text-[11px]',
            )}
            dir="rtl"
          >
            {t('triggerText') || '(راهنما)'}
          </span>
        )}
      </DialogTrigger>

      <DialogContent
        className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-2xl border-slate-200/80 bg-white p-0 shadow-2xl"
        dir="rtl"
      >
        {/* Custom Header */}
        <div className="relative flex items-start rounded-t-2xl border-b border-slate-100 bg-slate-50/50 p-5 md:p-6">
          <div className="flex flex-col gap-1 pl-6 text-right">
            <DialogTitle className="flex items-center justify-start gap-2 text-base font-black text-slate-800">
              <MonitorPlayIcon size={22} className="text-blue-600" /> {resolvedTitle}
            </DialogTitle>
            {resolvedDescription && (
              <DialogDescription className="mt-0.5 text-right text-xs leading-relaxed font-medium text-slate-400">
                {resolvedDescription}
              </DialogDescription>
            )}
          </div>
          <DialogClose
            aria-label={t('close') || 'بستن'}
            className="absolute top-4 left-4 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 md:top-5 md:left-5"
          >
            <X size={18} />
          </DialogClose>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-4 p-5 md:p-6">
          {resolvedVideoSrc && (
            <AutoAspectPlayer src={resolvedVideoSrc} poster={resolvedVideoPoster} />
          )}

          {resolvedContent && (
            <div
              className="max-h-[300px] w-full overflow-y-auto rounded-2xl border border-slate-100/80 bg-slate-50/60 p-5 text-right"
              dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(resolvedContent) }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
