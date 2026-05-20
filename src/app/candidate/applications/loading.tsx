import { Skeleton, SkeletonCard } from "@/components/ui";

export default function CandidateApplicationsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="skeleton-shimmer h-7 w-56 rounded-md" />
          <div className="skeleton-shimmer mt-2 h-4 w-80 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton-shimmer h-9 w-9 rounded-lg" />
          <div className="skeleton-shimmer h-9 w-9 rounded-lg" />
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Application cards */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
