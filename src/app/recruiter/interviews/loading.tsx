import { Skeleton, SkeletonCard } from "@/components/ui";

export default function RecruiterInterviewsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="skeleton-shimmer h-7 w-32 rounded-md" />
        <div className="skeleton-shimmer mt-2 h-4 w-72 rounded-md" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer h-4 w-10 rounded" />
          <div className="skeleton-shimmer h-8 w-16 rounded-lg" />
          <div className="skeleton-shimmer h-8 w-20 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer h-9 w-32 rounded-lg" />
          <div className="skeleton-shimmer h-6 w-20 rounded-full" />
        </div>
      </div>

      <div className="rounded-2xl border border-[--border] bg-[--surface] p-6">
        <Skeleton className="mb-2 h-5 w-48" />
        <Skeleton className="mb-4 h-3 w-64" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
