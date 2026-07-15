'use client';

import { useTranslations } from 'next-intl';
import dayjs from '@/lib/dayjs-jalali';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { AutomationErrorRow } from '@/types/automationError';

interface ErrorDetailsSheetProps {
  error: AutomationErrorRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ErrorDetailsSheet({ error, open, onOpenChange }: ErrorDetailsSheetProps) {
  const t = useTranslations('AutomationErrors');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        dir="rtl"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b px-4 py-3 ps-12">
          <SheetTitle className="text-start text-base">{t('detailsDrawerTitle')}</SheetTitle>
        </SheetHeader>

        {error && (
          <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <div className="flex items-center gap-2">
              <Badge>{error.queue}</Badge>
              {error.code !== undefined && <Badge variant="outline">{t('code')}: {error.code}</Badge>}
              {error.subcode !== undefined && (
                <Badge variant="outline">{t('subcode')}: {error.subcode}</Badge>
              )}
              <Badge variant="outline">{t('jobId')}: {error.jobId}</Badge>
              <Badge variant="outline">{t('attempts')}: {error.attemptsMade}</Badge>
            </div>

            <div>
              <h3 className="text-sm font-semibold">{error.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{error.description}</p>
            </div>

            <div className="text-xs text-slate-400">
              {t('failedAt')}:{' '}
              {dayjs(error.failedAt).tz('Asia/Tehran').calendar('jalali').format('YYYY/MM/DD HH:mm')}
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">{t('payload')}</p>
              <pre className="scrollbar-thin max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs" dir="ltr">
                {JSON.stringify(error.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
