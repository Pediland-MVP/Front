'use client';

import { useTranslations } from 'next-intl';
import { HelpMeDialog } from '@/components/Global/HelpMeDialog';
import { MonitorPlayIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui';
import Link from 'next/link';

// Dummy data for learning videos
// const learnVideos = Array.from({ length: 10 }).map((_, i) => ({
//     id: i,
//     title: `Learning Module ${i + 1}: Mastering the Platform`,
//     description: `In this session ${i + 1}, we explore advanced features and tips to get the most out of your experience.`,
//     // Using a sample video URL for testing
//     videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
// }));

const learnVideos = [
  {
    title: 'آموزش اتصال دایرکت هوشمند',
    description: 'چطور پیج اینستاگرام را به دایرکت هوشمند بفروش متصل کنیم',
    videoUrl:
      'https://befroosh.s3.ir-thr-at1.arvanstorage.ir/learn%2Ff54e8c002432b82b23a046865a9e9f1067430006-720p.mp4?versionId=',
  },
  {
    title: 'نحوه ساخت دایرکت و کامنت هوشمند',
    description: 'راهنمای کوتاه ساخت پیام خودکار برای کامنتها و دایرکتها',
    videoUrl:
      'https://befroosh.s3.ir-thr-at1.arvanstorage.ir/learn%2F828c43efc1b5fc5d5807dc1ca2da790a67648285-480p.mp4?versionId=',
  },
];

export default function LearnPage() {
  const t = useTranslations('Learn');

  const pathname = usePathname();

  return (
    <div className="_settings-page flex h-full flex-col overflow-y-auto rounded-t-3xl bg-linear-to-t from-white/85 to-white p-5 md:h-[calc(100vh-88px)] md:rounded-t-none md:p-8">
      {pathname === '/learn' && (
        <div className="mb-4 flex w-full justify-end md:mb-8">
          <Button variant="ghost" asChild className="gap-2 text-gray-500 hover:text-gray-900">
            <Link href="/">{t('enter_panel')}</Link>
          </Button>
        </div>
      )}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
          <p className="mt-1 text-gray-500">{t('subtitle')}</p>
        </div>

        {learnVideos.map((video) => (
          <HelpMeDialog
            key={video.title}
            title={video.title}
            description={video.description}
            videoSrc={video.videoUrl}
            position="center"
          >
            <button
              className={cn(
                'group text-secondary flex min-h-14 w-full items-center gap-3 rounded-lg bg-blue-50 px-5 py-3 text-left font-medium shadow shadow-blue-200/90 transition-all duration-300 hover:translate-x-1 hover:bg-blue-100/80',
              )}
            >
              <MonitorPlayIcon
                className="text-secondary/80 size-6 shrink-0 duration-300 group-hover:text-blue-600"
                weight="duotone"
              />
              <div className="flex flex-col gap-0.5 text-start">
                <span className="text-secondary text-sm font-semibold duration-300 group-hover:text-blue-900 md:text-base">
                  {video.title}
                </span>
                <span className="line-clamp-1 text-xs font-normal text-gray-500 group-hover:text-blue-800/70">
                  {video.description}
                </span>
              </div>
            </button>
          </HelpMeDialog>
        ))}
      </div>
    </div>
  );
}
