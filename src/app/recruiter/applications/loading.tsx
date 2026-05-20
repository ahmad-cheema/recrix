import { SkeletonTable } from "@/components/ui";

export default function RecruiterApplicationsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="skeleton-shimmer h-7 w-40 rounded-md" />
        <div className="skeleton-shimmer mt-2 h-4 w-72 rounded-md" />
      </div>

      <div className="grid gap-3 rounded-xl border border-[--border] bg-[--surface] p-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-10 rounded-lg" />
        ))}
      </div>

      <SkeletonTable rows={8} cols={7} />
    </div>
  );
}
