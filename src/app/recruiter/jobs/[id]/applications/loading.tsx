import { Skeleton, SkeletonTable } from "@/components/ui";

export default function RecruiterJobApplicationsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-36" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <div className="rounded-2xl border border-[--border] bg-[--surface] p-6">
        <Skeleton className="mb-2 h-5 w-40" />
        <Skeleton className="mb-4 h-3 w-48" />
        <SkeletonTable rows={6} cols={5} />
      </div>
    </div>
  );
}
