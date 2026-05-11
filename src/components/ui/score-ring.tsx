"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  size = 128,
  strokeWidth = 10,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    clamped > 75
      ? "var(--success)"
      : clamped >= 50
      ? "var(--warning)"
      : "var(--destructive)";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.4 }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-semibold text-[--text-primary]">
          {clamped}
        </p>
        <p className="text-xs text-[--text-secondary]">Match</p>
      </div>
    </div>
  );
}
