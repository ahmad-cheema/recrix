import { SkeletonTable } from "@/components/ui";

export default function RecruiterJobsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="skeleton-shimmer h-7 w-48 rounded-md" />
          <div className="skeleton-shimmer mt-2 h-4 w-64 rounded-md" />
        </div>
        <div className="skeleton-shimmer h-10 w-32 rounded-lg" />
      </div>

      <div className="grid gap-3 rounded-xl border border-[--border] bg-[--surface] p-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-10 rounded-lg" />
        ))}
      </div>

      <SkeletonTable rows={6} cols={7} />
    </div>
  );
}
