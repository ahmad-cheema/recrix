import { Skeleton } from "@/components/ui";

export default function RecruiterScreeningLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="skeleton-shimmer h-7 w-44 rounded-md" />
          <div className="skeleton-shimmer mt-2 h-4 w-72 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="skeleton-shimmer h-9 w-28 rounded-lg" />
          <div className="skeleton-shimmer h-9 w-28 rounded-lg" />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[--border] bg-[--surface] p-6"
          >
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-7 w-10" />
          </div>
        ))}
      </section>

      <div className="rounded-2xl border border-[--border] bg-[--surface] p-6">
        <Skeleton className="mb-2 h-5 w-40" />
        <Skeleton className="mb-4 h-3 w-64" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
