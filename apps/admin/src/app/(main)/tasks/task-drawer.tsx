'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { TaskListItem } from '@/types/task';
import { SmsData } from '@/types/sms';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ContactOptions } from '@/components/table/contact-options';
import { OtpDialog } from '@/components/table/dialog-otp';
import { SendSMSDialog } from '@/components/table/dialog-sms';
import { LabelChips } from '@/components/table/label-chips';
import { TaskManagementPanel } from '@/components/tasks/task-management-panel';
import { toAssignedLabels } from './to-assigned-labels';

interface TaskDrawerProps {
  task: TaskListItem | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  currentUserRole: string;
  onChanged?: () => void;
}

export function TaskDrawer({
  task,
  open,
  onOpenChange,
  currentUserRole,
  onChanged,
}: TaskDrawerProps): React.JSX.Element {
  const t = useTranslations('Tasks');

  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsData, setSmsData] = useState<SmsData | null>(null);
  const openSmsDialog = (data: SmsData) => {
    setSmsData(data);
    setSmsDialogOpen(true);
  };

  const fullName = task ? `${task.user.firstname} ${task.user.lastname}`.trim() : '';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          dir="rtl"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          {/* ps-12 keeps the title clear of the Sheet close button (top inline-start in RTL). */}
          <SheetHeader className="shrink-0 border-b px-4 py-3 ps-12">
            <SheetTitle className="text-start text-base">{t('drawerTitle')}</SheetTitle>
          </SheetHeader>

          {task && (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Compact user header */}
              <div className="flex shrink-0 items-start gap-3 border-b bg-slate-50/60 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-xs font-bold text-white">
                  {`${task.user.firstname?.[0] ?? ''}${task.user.lastname?.[0] ?? ''}`.trim() ||
                    '—'}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={`/users/${task.user.id}`}
                    className="text-primary truncate text-sm font-semibold underline-offset-4 hover:underline"
                  >
                    {fullName || '—'}
                  </Link>

                  {task.instagramUsername ? (
                    <a
                      href={`https://www.instagram.com/${task.instagramUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                      className="text-primary w-fit truncate text-xs underline-offset-4 hover:underline"
                    >
                      @{task.instagramUsername}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <ContactOptions
                      leadId={task.user.id}
                      mobile={task.user.mobile}
                      fullName={fullName}
                      openSmsDialog={openSmsDialog}
                    />
                    <OtpDialog size="sm" />
                  </div>

                  <div className="mt-1">
                    <LabelChips labels={toAssignedLabels(task.labels)} />
                  </div>
                </div>
              </div>

              {/* Task panel — fills remaining height; scrolls internally, sticky form */}
              <div className="min-h-0 flex-1">
                <TaskManagementPanel
                  userId={task.user.id}
                  currentUserRole={currentUserRole}
                  onChanged={onChanged}
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <SendSMSDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        smsData={smsData}
        recipientType="user"
      />
    </>
  );
}
