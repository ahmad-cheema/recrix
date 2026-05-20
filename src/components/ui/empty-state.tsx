import Link from "next/link";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-[--border] bg-[--surface] px-6 py-12 text-center",
        className
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[--border] bg-[--surface-raised] text-[--text-muted]">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-[--text-primary]">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-[--text-secondary]">
          {description}
        </p>
      ) : null}
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[--accent] px-4 py-2 text-sm font-medium text-[--background] transition-colors hover:bg-[--accent-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]"
        >
          {actionLabel}
        </Link>
      ) : actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[--accent] px-4 py-2 text-sm font-medium text-[--background] transition-colors hover:bg-[--accent-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
