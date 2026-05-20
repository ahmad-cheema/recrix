import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import RecruiterJobsClient from "./RecruiterJobsClient";
import RecruiterJobsLoading from "./loading";
import { getSessionPayload } from "@/lib/auth/session";
import { getRecruiterApplicationStats } from "@/lib/applications/service";
import { listRecruiterJobs } from "@/lib/jobs/service";

const primaryLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-[--accent] px-4 py-2 text-sm font-medium text-[--background] transition-colors hover:bg-[--accent-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";

export default async function RecruiterJobsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  const jobs = await listRecruiterJobs(session.sub);
  const { byJobId } = await getRecruiterApplicationStats(session.sub);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your job listings</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            Manage active, draft, and closed postings.
          </p>
        </div>
        <Link className={primaryLinkClass} href="/recruiter/jobs/new">
          Post new job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
          No jobs yet. Post a job to start receiving applications.
        </div>
      ) : (
        <Suspense fallback={<RecruiterJobsLoading />}>
          <RecruiterJobsClient jobs={jobs} applicationCounts={byJobId} />
        </Suspense>
      )}
    </div>
  );
}
