import { SkeletonCard } from "@/components/ui";

export default function CandidateJobsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="skeleton-shimmer h-7 w-48 rounded-md" />
          <div className="skeleton-shimmer mt-2 h-4 w-64 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton-shimmer h-9 w-9 rounded-lg" />
          <div className="skeleton-shimmer h-9 w-9 rounded-lg" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="skeleton-shimmer h-10 w-64 rounded-lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-10 w-36 rounded-lg" />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
