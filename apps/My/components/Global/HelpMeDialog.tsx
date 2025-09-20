// src/components/Global/HelpMe.dialog.tsx
"use client";

import { cn } from "@befroosh/lib/utils";
import { InfoIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { useState } from "react";

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
} from "@befroosh/ui";

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
  description: string;
  videoSrc: string;
  videoPoster?: string;
  position?: Position;
  className?: string;
  noAbsolute?: boolean;
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

  return positions[position] || positions["right-top"];
};

export const HelpMeDialog = ({
  title,
  description,
  videoSrc,
  videoPoster,
  position = "right-top",
  className,
  noAbsolute = false,
}: HelpDialogProps) => {
  const [open, setOpen] = useState(false);

  const t = useTranslations("Helpme");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div
          className={cn(
            !noAbsolute && getPositionClasses(position),
            className,
            "cursor-pointer duration-100 hover:scale-110",
          )}
        >
          <InfoIcon size={18} weight="duotone" className="text-gray-500" />
          <span className="sr-only">{t("help")}</span>
        </div>
      </DialogTrigger>
      <DialogContent className="h-full w-full gap-0 p-0 sm:h-auto sm:max-w-4xl">
        <div className="flex h-full flex-col">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-base">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="flex w-full items-center justify-center">
            <VideoComp
              shape="vertical"
              variant="bordered"
              src={videoSrc}
              poster={videoPoster}
              controls
              className="h-[800px] w-full object-cover"
              preload="metadata"
            >
              {t("browserDosntSupport")}
            </VideoComp>
          </div>

          <DialogFooter className="p-6 pt-4">
            <Button onClick={() => setOpen(false)} className="w-full sm:w-auto">
              {t("close")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
