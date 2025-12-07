import type React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";

interface ProgressLineProps {
  percentage: number;
  width?: number;
  height?: number;
  // Legacy props for backward compatibility
  size?: number;
  strokeWidth?: number;
  id?: string;
  type?: "percentage" | "days";
  totalDays?: number;
  showText?: boolean;
}

export const ProgressLine = ({
  percentage,
  width,
  height,
  size,
  strokeWidth,
  id = "linear-progress-gradient",
  type = "percentage",
  totalDays,
  showText = false,
}: ProgressLineProps) => {
  // Handle backward compatibility: if size is provided, use it as width
  const finalWidth = width || size;
  const finalHeight = height || strokeWidth || 20;
  const useFullWidth = !finalWidth;
  const locale = useLocale();

  const actualPercentage =
    type === "days" && totalDays ? (percentage / totalDays) * 100 : percentage;

  // Ensure we have a valid percentage
  const validPercentage = Math.max(0, Math.min(100, actualPercentage || 0));

  return (
    <div className={cn("flex flex-col", showText ? "gap-2" : "")}>
      {/* نوار پیشرفت */}
      <div
        className="relative w-full"
        style={{ transform: locale === "fa" ? "scaleX(-1)" : "scaleX(1)" }}
      >
        <svg
          width={useFullWidth ? "100%" : finalWidth}
          height={finalHeight}
          className="overflow-hidden rounded-full"
          viewBox={
            useFullWidth ? undefined : `0 0 ${finalWidth} ${finalHeight}`
          }
        >
          {/* پس‌زمینه خاکستری */}
          <rect
            x={0}
            y={0}
            width="100%"
            height="100%"
            fill="#e6e6e6"
            rx={finalHeight / 2}
            ry={finalHeight / 2}
          />

          {/* تعریف گرادیانت */}
          <defs>
            <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                className="[stop-color:theme(colors.violet.600)]"
              />
              <stop
                offset="100%"
                className="[stop-color:theme(colors.blue.400)]"
              />
            </linearGradient>
          </defs>

          {/* نوار پیشرفت متحرک */}
          <motion.rect
            x="0%"
            y={0}
            width={`${validPercentage}%`}
            height="100%"
            fill={`url(#${id})`}
            rx={finalHeight / 2}
            ry={finalHeight / 2}
            initial={{
              width: "0%",
            }}
            animate={{
              width: `${validPercentage}%`,
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </svg>
      </div>

      {/* متن درصد - فقط در صورت فعال بودن showText */}
      {showText && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span
            className={cn(
              "text-sm font-bold",
              validPercentage < 50 ? "text-blue-600" : "text-violet-700",
              validPercentage === 0 && "text-destructive",
            )}
          >
            {type === "days"
              ? `${percentage} روز`
              : `${Math.round(validPercentage)}%`}
          </span>
        </motion.div>
      )}
    </div>
  );
};
