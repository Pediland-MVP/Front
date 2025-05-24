"use client"

import { useState } from "react"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Video } from "./video"
import { useTranslations } from "next-intl"

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
  | "center"

interface HelpDialogProps {
  title: string
  description: string
  videoSrc: string
  videoPoster?: string
  position?: Position
  className?: string
  noAbsolute?: boolean
}

const getPositionClasses = (position: Position, noAbsolute: boolean = false): string => {
  const positions = {
    left: "absolute left-2 top-1/2 -translate-y-1/2",
    "left-top": "absolute left-2 top-2",
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
  }

  return positions[position] || positions["right-top"]
}

export default function HelpmeDialog({
  title,
  description,
  videoSrc,
  videoPoster,
  position = "right-top",
  className,
  noAbsolute = false
}: HelpDialogProps) {
  const [open, setOpen] = useState(false)

  const t = useTranslations('Helpme')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div
          className={cn(
            !noAbsolute && getPositionClasses(position),
            className,
            'cursor-pointer hover:scale-110 duration-100'
          )}
        >
          <HelpCircle className="h-4 w-4 text-primary" />
          <span className="sr-only">{t('help')}</span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl w-full h-full sm:h-auto max-h-[90vh] p-0 gap-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">{description}</DialogDescription>
          </DialogHeader>

          <div className="w-full flex justify-center items-center">
              <Video
                shape='vertical'
                variant="bordered"
                src={videoSrc}
                poster={videoPoster}
                controls
                className="w-full h-full object-cover"
                preload="metadata"
              >
                {t('browserDosntSupport')}
              </Video>
          </div>

          <DialogFooter className="p-6 pt-4">
            <Button onClick={() => setOpen(false)} className="w-full sm:w-auto">
              {t('close')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
