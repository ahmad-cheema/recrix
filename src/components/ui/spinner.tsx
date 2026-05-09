import * as React from "react";
import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-7 w-7 border-[3px]",
};

export function Spinner({
  size = "md",
  className,
}: {
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <span
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "inline-block animate-spin rounded-full border-[--border] border-t-[--text-primary]",
        sizeClasses[size],
        className
      )}
    />
  );
}
