import { Skeleton, SkeletonCard } from "@/components/ui";

export default function RecruiterDashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="skeleton-shimmer h-7 w-52 rounded-md" />
          <div className="skeleton-shimmer mt-2 h-4 w-72 rounded-md" />
        </div>
        <div className="skeleton-shimmer h-10 w-32 rounded-lg" />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="flex flex-col gap-6 lg:col-span-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[--border] bg-[--surface] p-6"
              >
                <Skeleton className="mb-2 h-3 w-24" />
                <Skeleton className="h-7 w-10" />
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[--border] bg-[--surface] p-6">
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="mb-4 h-3 w-52" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <SkeletonCard />
          <SkeletonCard />
        </aside>
      </div>
    </div>
  );
}
