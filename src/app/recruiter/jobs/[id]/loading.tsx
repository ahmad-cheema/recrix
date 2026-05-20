import { Skeleton, SkeletonCard } from "@/components/ui";

export default function RecruiterJobDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-28" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="flex flex-col gap-4 lg:col-span-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </section>
        <aside className="flex flex-col gap-4 lg:col-span-4">
          <SkeletonCard />
          <SkeletonCard />
        </aside>
      </div>
    </div>
  );
}
