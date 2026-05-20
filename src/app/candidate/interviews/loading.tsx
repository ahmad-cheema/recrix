import { SkeletonCard } from "@/components/ui";

export default function CandidateInterviewsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="skeleton-shimmer h-7 w-40 rounded-md" />
        <div className="skeleton-shimmer mt-2 h-4 w-64 rounded-md" />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="flex flex-col gap-6 lg:col-span-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </section>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <SkeletonCard />
          <SkeletonCard />
        </aside>
      </div>
    </div>
  );
}
