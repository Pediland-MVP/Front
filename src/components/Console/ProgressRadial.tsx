import type React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FC } from "react";

interface ProgressRadialProps {
  percentage: number;
  size: number;
  strokeWidth: number;
  id?: string;
}

export const ProgressRadial: FC<ProgressRadialProps> = ({
  percentage,
  size,
  strokeWidth,
  id = "circular-progress-gradient",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* پس‌زمینه خاکستری */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e6e6e6"
        strokeWidth={strokeWidth}
      />

      {/* تعریف گرادیانت */}
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" className="[stop-color:theme(colors.violet.600)]" />
          <stop offset="100%" className="[stop-color:theme(colors.blue.400)]" />
        </linearGradient>
      </defs>

      {/* دایره متحرک */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />

      {/* متن درصد */}
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fontSize="14"
        fontWeight="bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={cn(
          percentage < 50
            ? "fill-[theme(colors.blue.600)]"
            : "fill-[theme(colors.violet.700)]",
        )}
      >
        {`${Math.round(percentage)}%`}
      </motion.text>
    </svg>
  );
};
