"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { ReactNode, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  VideoComp,
} from "@/components/index";
import { InfoIcon, MonitorPlayIcon } from "@phosphor-icons/react/dist/ssr";

type Position =
  | "left"
  | "left-top"
  | "left-bottom"
  | "right"
  | "right-top"
  | "right-bottom"
  | "top"
  | "top-left"
  | "top-right"
  | "bottom"
  | "bottom-left"
  | "bottom-right"
  | "center";

interface HelpDialogProps {
  title: string;
  description?: string;
  videoSrc: string;
  videoPoster?: string;
  position?: Position;
  className?: string;
  noAbsolute?: boolean;
  children?: ReactNode;
}

const getPositionClasses = (
  position: Position,
  noAbsolute: boolean = false,
): string => {
  const positions = {
    left: "absolute left-0 top-1/2 -translate-y-1/2",
    "left-top": "absolute left-0 top-2",
    "left-bottom": "absolute left-2 bottom-2",
    right: "absolute right-2 top-1/2 -translate-y-1/2",
    "right-top": "absolute right-2 top-2",
    "right-bottom": "absolute right-2 bottom-2",
    top: "absolute top-2 left-1/2 -translate-x-1/2",
    "top-left": "absolute top-2 left-2",
    "top-right": "absolute top-2 right-2",
    bottom: "absolute bottom-2 left-1/2 -translate-x-1/2",
    "bottom-left": "absolute bottom-2 left-2",
    "bottom-right": "absolute bottom-2 right-2",
    center: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  if (!noAbsolute) {
    return positions[position] || positions["right-top"];
  }

  return "";
};

export const HelpMeDialog = ({
  title,
  description,
  videoSrc,
  videoPoster,
  position = "right-top",
  className,
  noAbsolute = false,
  children,
}: HelpDialogProps) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Helpme");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <div
            className={cn(
              noAbsolute ? "" : getPositionClasses(position),
              className,
              "cursor-pointer duration-100 hover:scale-110",
            )}
          >
            <InfoIcon size={20} weight="duotone" className="text-gray-500" />
            <span className="sr-only">{t("help")}</span>
          </div>
        )}
      </DialogTrigger>

      <DialogContent className="flex h-full max-w-full flex-col rounded-none md:p-10">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center justify-center gap-2 text-base font-semibold">
            <MonitorPlayIcon size={22} /> {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground text-right text-[13px] md:mx-auto md:w-1/2 md:text-center">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex w-full flex-1 items-center justify-center">
          <VideoComp
            shape="vertical"
            src={videoSrc}
            poster={videoPoster}
            controls
            className="h-[800px] w-full object-cover"
            preload="metadata"
          >
            {t("browserDosntSupport")}
          </VideoComp>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} className="mx-auto w-[260px]">
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
