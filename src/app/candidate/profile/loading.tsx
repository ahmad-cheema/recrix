import { Skeleton } from "@/components/ui";

export default function CandidateProfileLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="skeleton-shimmer h-7 w-32 rounded-md" />
        <div className="skeleton-shimmer mt-2 h-4 w-72 rounded-md" />
      </div>

      <div className="rounded-2xl border border-[--border] bg-[--surface] p-6">
        <Skeleton className="mb-2 h-4 w-40" />
        <Skeleton className="mb-4 h-3 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="mt-4 h-24 w-full" />
        <Skeleton className="mt-4 h-9 w-32 rounded-lg" />
      </div>

      <div className="rounded-2xl border border-[--border] bg-[--surface] p-6">
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-4 h-3 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="mt-3 h-9 w-32 rounded-lg" />
      </div>
    </div>
  );
}
