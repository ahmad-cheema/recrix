import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/auth/session";
import { listActiveJobs } from "@/lib/jobs/service";
import CandidateJobsClient from "./CandidateJobsClient";

export default async function CandidateJobsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  const jobs = await listActiveJobs();

  return <CandidateJobsClient jobs={jobs} />;
}
