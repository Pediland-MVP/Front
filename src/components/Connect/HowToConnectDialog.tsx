import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlugsIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui";
import { useTranslations } from "next-intl";

interface HowToConnectDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const HowToConnectDialog = ({
  open,
  setOpen,
}: HowToConnectDialogProps) => {
  const t = useTranslations("Connect");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-7 bg-violet-50">
        <DialogHeader className="gap-2">
          <PlugsIcon
            size={50}
            weight="duotone"
            className="text-primary mx-auto"
          />
          <DialogTitle className="text-primary text-base">
            راهنمای اتصال اکانت اینستاگرام{" "}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-[15px]">
          <ol className="list-decimal space-y-2 pr-4 text-violet-950">
            <li>ابتدا فیلترشکن خود را روشن کنید.</li>
            <li>بعد از زدن دکمه زیر به سایت اینستاگرام منتقل می‌شوید.</li>
            <li>با اکانت موردنظر خود لاگین کنید.</li>
            <li>
              دسترسی‌های خواسته شده را انتخاب کرده و بر روی دکمه{" "}
              <span className="font-semibold">Allow</span> کلیک کنید.
            </li>
          </ol>

          <div className="mt-8 rounded-lg border border-dashed border-blue-500/60 bg-blue-50/50 p-3">
            <p className="text-xs text-blue-900">
              <span className="font-medium">{t("befroosh_meta_partner")}</span>{" "}
              <span className="text-[11px]">({t("instagram_holding")})</span>{" "}
              {t("description")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full">انتقال به سایت اینستاگرام</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
