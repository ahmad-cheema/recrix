import { Skeleton } from "@/components/ui";

export default function CandidateSavedLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="skeleton-shimmer h-7 w-40 rounded-md" />
        <div className="skeleton-shimmer mt-2 h-4 w-64 rounded-md" />
      </div>

      <div className="rounded-2xl border border-[--border] bg-[--surface] p-6">
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="mb-4 h-3 w-48" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
