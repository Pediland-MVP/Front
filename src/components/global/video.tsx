import { cn } from "@/lib/utils";
import { useRef, VideoHTMLAttributes } from "react";

export interface VideoProps extends VideoHTMLAttributes<HTMLVideoElement> {
    shape: 'square' | 'rectangle' | 'vertical',
    variant: 'bordered',
    className?: string
}


export function Video({shape, variant, className, ...params}: VideoProps) {

    const ref = useRef<HTMLVideoElement>(null)

    return (
        <video {...params} className={cn(className, shape === 'vertical' && 'h-[462px] w-[260px]', variant === 'bordered' && 'border border-primary', 'rounded-md')} ref={ref} ></video>
    )

}