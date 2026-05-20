import { Skeleton } from "@/components/ui";

export default function CandidateSettingsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="skeleton-shimmer h-7 w-48 rounded-md" />
        <div className="skeleton-shimmer mt-2 h-4 w-72 rounded-md" />
      </div>

      <div className="rounded-2xl border border-[--border] bg-[--surface] p-6">
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-4 h-3 w-44" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="mt-3 h-10 w-full" />
        <Skeleton className="mt-4 h-9 w-40 rounded-lg" />
      </div>

      <div className="rounded-2xl border border-[--border] bg-[--surface] p-6">
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="mb-4 h-3 w-48" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <Skeleton className="mt-4 h-9 w-40 rounded-lg" />
      </div>
    </div>
  );
}
