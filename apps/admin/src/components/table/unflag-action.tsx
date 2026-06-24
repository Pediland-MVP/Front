// src/components/table/unflag-action.tsx
"use client";

import { useState } from "react";
import api from "@/hooks/swr/api-client";
import { toast } from "sonner";

// UI Imports
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RotateCcw } from "lucide-react";

export function UnflagAction({
  userId,
  userName,
  onUnflagged,
}: {
  userId: string;
  userName?: string;
  onUnflagged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUnflag = async () => {
    try {
      setLoading(true);
      await api.post(`/users/${userId}/unflag`);
      toast.success("کاربر با موفقیت بازگردانی شد.");
      setOpen(false);
      onUnflagged?.();
    } catch (error) {
      console.error(error);
      toast.error("خطا در بازگردانی کاربر.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 gap-1 px-2 text-[11px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        بازگردانی
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>بازگردانی کاربر</DialogTitle>
            <DialogDescription>
              آیا از بازگردانی {userName ? `«${userName}»` : "این کاربر"} مطمئن
              هستید؟ علامت حذف برداشته می‌شود و کاربر دوباره در لیست اصلی نمایش
              داده خواهد شد.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={handleUnflag} disabled={loading}>
              {loading ? "در حال بازگردانی..." : "بله، بازگردانی کن"}
            </Button>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                انصراف
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
