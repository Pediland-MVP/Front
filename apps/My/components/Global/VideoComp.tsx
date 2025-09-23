"use client";

import { cn } from "@befroosh/ui";
import { useRef, VideoHTMLAttributes } from "react";

export interface VideoCompProps extends VideoHTMLAttributes<HTMLVideoElement> {
  shape: "square" | "rectangle" | "vertical";
  variant: "bordered";
  className?: string;
}

export function VideoComp({
  shape,
  variant,
  className,
  ...params
}: VideoCompProps) {
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <video
      {...params}
      className={cn(
        className,
        shape === "vertical" && "h-[462px] w-[260px]",
        variant === "bordered" && "border-primary border",
        "rounded-md",
      )}
      ref={ref}
    ></video>
  );
}
