import { Skeleton } from "@/components/ui";

export default function RootLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <div className="rounded-2xl border border-[--border] bg-[--surface] p-6">
        <Skeleton className="mb-3 h-6 w-48" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
