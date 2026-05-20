import { Skeleton } from "@/components/ui";

export default function RecruiterApplicantsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="skeleton-shimmer h-7 w-48 rounded-md" />
        <div className="skeleton-shimmer mt-2 h-4 w-72 rounded-md" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, colIndex) => (
          <div
            key={colIndex}
            className="rounded-2xl border border-[--border] bg-[--surface] p-5"
          >
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="mb-4 h-3 w-24" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[--border] bg-[--surface-raised] p-3"
                >
                  <Skeleton className="mb-2 h-3 w-24" />
                  <Skeleton className="mb-2 h-3 w-32" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
