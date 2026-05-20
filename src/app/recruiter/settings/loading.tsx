import { Skeleton } from "@/components/ui";

export default function RecruiterSettingsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Skeleton className="h-7 w-36" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[--border] bg-[--surface] p-6"
        >
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="mb-4 h-3 w-64" />
          <div className="grid gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
