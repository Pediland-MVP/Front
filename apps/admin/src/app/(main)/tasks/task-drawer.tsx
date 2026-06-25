"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { TaskListItem } from "@/types/task";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ContactOptions } from "@/components/table/contact-options";
import { OtpDialog } from "@/components/table/dialog-otp";
import { LabelChips } from "@/components/table/label-chips";
import { TaskManagementPanel } from "@/components/tasks/task-management-panel";
import { toAssignedLabels } from "./to-assigned-labels";

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
  const t = useTranslations("Tasks");

  const fullName = task
    ? `${task.user.firstname} ${task.user.lastname}`.trim()
    : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-lg flex flex-col overflow-y-auto"
        dir="rtl"
      >
        <SheetHeader>
          <SheetTitle>{t("drawerTitle")}</SheetTitle>
        </SheetHeader>

        {task && (
          <div className="flex flex-col gap-4 px-4 pb-4">
            {/* Compact user header */}
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              {/* Full name → customers detail page */}
              <Link
                href={`/customers/${task.user.id}`}
                className="text-primary font-medium hover:underline underline-offset-4 text-sm"
              >
                {fullName}
              </Link>

              {/* Instagram username */}
              {task.instagramUsername ? (
                <a
                  href={`https://www.instagram.com/${task.instagramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs hover:underline underline-offset-4"
                >
                  @{task.instagramUsername}
                </a>
              ) : (
                <span className="text-muted-foreground text-xs">-</span>
              )}

              {/* Contact actions */}
              <div className="flex flex-wrap items-center gap-2">
                <ContactOptions
                  leadId={task.user.id}
                  mobile={task.user.mobile}
                  fullName={fullName}
                />
                <OtpDialog size="sm" />
              </div>

              {/* Label chips */}
              <LabelChips labels={toAssignedLabels(task.labels)} />
            </div>

            {/* Task management panel */}
            <TaskManagementPanel
              userId={task.user.id}
              currentUserRole={currentUserRole}
              onChanged={onChanged}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
