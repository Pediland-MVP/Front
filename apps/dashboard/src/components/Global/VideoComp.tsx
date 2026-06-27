'use client';

import { cn } from '@/lib/utils';
import { useRef, VideoHTMLAttributes } from 'react';

interface VideoCompProps extends VideoHTMLAttributes<HTMLVideoElement> {
  shape: 'square' | 'rectangle' | 'vertical';
  variant?: 'no-border';
  className?: string;
}

export const VideoComp = ({ shape, variant, className, ...params }: VideoCompProps) => {
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <video
      {...params}
      className={cn(
        className,
        'rounded-lg border-2',
        shape === 'vertical' && 'h-[462px] w-[260px]',
        variant === 'no-border' && 'border-0',
      )}
      ref={ref}
    ></video>
  );
};
