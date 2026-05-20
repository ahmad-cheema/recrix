import { Skeleton, SkeletonCard } from "@/components/ui";

export default function CandidateInterviewLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="skeleton-shimmer h-7 w-48 rounded-md" />
          <div className="skeleton-shimmer mt-2 h-4 w-64 rounded-md" />
        </div>
        <div className="skeleton-shimmer h-9 w-24 rounded-lg" />
      </div>

      <div className="rounded-2xl border border-[--border] bg-[--surface] p-6">
        <Skeleton className="mb-3 h-4 w-48" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-5/6" />
        <Skeleton className="mb-4 h-4 w-4/5" />
        <Skeleton className="h-28 w-full" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
