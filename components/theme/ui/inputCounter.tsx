"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface InputCounterProps {
  placeholder?: string
  maxLength?: number
  className?: string
  text: string | undefined
}

export default function InputCounter({
  text,
  placeholder = "Type your message here...",
  maxLength = 100,
  className,
}: InputCounterProps) {
  const charCount = text?.length || 0
  const progress = Math.min((charCount / maxLength) * 100, 100)
  const isOverLimit = charCount > maxLength

  // SVG circle properties
  const size = 25
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative w-full">
      <div className="bottom-3 right-3 flex items-center gap-1">
        <span className={cn("text-xs font-medium", isOverLimit ? "text-red-500" : "text-muted-foreground")}>
          {charCount}/{maxLength}
        </span>
        <div className="relative h-6 w-6 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
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
              className={isOverLimit ? "text-red-500" : "text-primary"}
              style={{ transition: "stroke-dashoffset 0.2s ease, stroke 0.2s ease" }}
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
