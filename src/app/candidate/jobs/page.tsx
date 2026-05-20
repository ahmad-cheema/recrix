import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/auth/session";
import { listCandidateApplications } from "@/lib/applications/service";
import { listActiveJobs } from "@/lib/jobs/service";
import { listSavedJobs } from "@/lib/jobs/saved";
import CandidateJobsClient from "./CandidateJobsClient";
import CandidateJobsLoading from "./loading";

export default async function CandidateJobsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  const [jobs, applications, savedJobIds] = await Promise.all([
    listActiveJobs(),
    listCandidateApplications(session.sub),
    listSavedJobs(session.sub),
  ]);

  return (
    <Suspense fallback={<CandidateJobsLoading />}>
      <CandidateJobsClient
        jobs={jobs}
        applications={applications}
        savedJobIds={savedJobIds}
      />
    </Suspense>
  );
}
