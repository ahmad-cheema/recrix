"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Checkbox({ className, children, ...props }: CheckboxProps) {
  return (
    <label className={cn("inline-flex items-center gap-2", className)}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border border-[--border] bg-[--surface-raised] text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]"
        {...props}
      />
      {children ? (
        <span className="text-sm text-[--text-secondary]">{children}</span>
      ) : null}
    </label>
  );
}
