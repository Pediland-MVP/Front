"use client";

import { cn } from "@/lib/utils";

interface InputCounterProps {
  placeholder?: string;
  maxLength?: number;
  className?: string;
  text: string | undefined;
}

export const InputCounter = ({
  text,
  placeholder = "Type your message here...",
  maxLength = 100,
  className,
}: InputCounterProps) => {
  const charCount = text?.length || 0;
  const progress = Math.min((charCount / maxLength) * 100, 100);
  const isOverLimit = charCount >= maxLength;

  // SVG circle properties
  const size = 25;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex size-5 items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-90deg]"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted-foreground/20"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={isOverLimit ? "text-orange-500" : "text-green-600"}
            style={{
              transition: "stroke-dashoffset 0.2s ease, stroke 0.2s ease",
            }}
          />
        </svg>
      </div>

      <span
        className={cn(
          "flex text-xs leading-px font-medium",
          isOverLimit ? "text-orange-500" : "text-green-600",
        )}
      >
        {charCount}/{maxLength} کاراکتر
      </span>
    </div>
  );
};
