import { Skeleton } from "@/components/ui";

export default function RecruiterReportsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="skeleton-shimmer h-7 w-52 rounded-md" />
        <div className="skeleton-shimmer mt-2 h-4 w-80 rounded-md" />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[--border] bg-[--surface] p-6"
          >
            <Skeleton className="mb-2 h-3 w-28" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[--border] bg-[--surface] p-6"
          >
            <Skeleton className="mb-2 h-5 w-44" />
            <Skeleton className="mb-4 h-3 w-64" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, itemIndex) => (
                <Skeleton
                  key={itemIndex}
                  className="h-12 w-full rounded-lg"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
