// src/app/leads/dialog-new.tsx

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export default function DialogDelete({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-red-500">
            <WarningCircleIcon weight="duotone" />
            هشدار حذف
          </DialogTitle>
          <DialogDescription>
            آیا از حدف این مورد مطمئن هستید؟ با حدف این آیتم تمامی اطلاعات متصل
            به آن نیز حذف شده و دیگر قابل بازیابی نخواهد بود.
          </DialogDescription>
          <DialogFooter>
            <Button
              type="button"
              color="destructive"
              onClick={() => {
                onConfirm();
              }}
            >
              بله، مطمئن هستم
            </Button>
            <DialogClose asChild>
              <Button color="cancel">انصراف</Button>
            </DialogClose>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
