import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "destructive";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-[--border] text-[--text-secondary]",
  success: "border-[--success] text-[--success]",
  warning: "border-[--warning] text-[--warning]",
  destructive: "border-[--destructive] text-[--destructive]",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
);

Badge.displayName = "Badge";

export function getScoreVariant(score: number): BadgeVariant {
  if (score > 75) {
    return "success";
  }
  if (score >= 50) {
    return "warning";
  }
  return "destructive";
}

export function ScoreBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  return (
    <Badge className={className} variant={getScoreVariant(score)}>
      {score}
    </Badge>
  );
}
