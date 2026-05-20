import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/auth/session";
import { listRecruiterApplications } from "@/lib/applications/service";
import { listInterviewSessionsForApplications } from "@/lib/interviews/service";
import RecruiterInterviewsClient from "./RecruiterInterviewsClient";
import RecruiterInterviewsLoading from "./loading";

export default async function RecruiterInterviewsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  const applications = await listRecruiterApplications(session.sub);
  const applicationIds = applications.map((application) => application.id);
  const sessions = await listInterviewSessionsForApplications(applicationIds);

  const applicationMap = new Map(
    applications.map((application) => [application.id, application])
  );

  const interviewItems = sessions
    .map((sessionItem) => {
      const application = applicationMap.get(sessionItem.application_id);
      if (!application) {
        return null;
      }
      return {
        id: sessionItem.id,
        applicationId: sessionItem.application_id,
        jobTitle: application.job?.title ?? "Role",
        candidateEmail: application.candidate?.email ?? "Candidate",
        status: sessionItem.status,
        scheduledAt: sessionItem.created_at,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    applicationId: string;
    jobTitle: string;
    candidateEmail: string;
    status: string;
    scheduledAt: string | null;
  }>;

  const pendingInvites = applications
    .filter((application) => application.status === "interview_scheduled")
    .map((application) => ({
      applicationId: application.id,
      jobTitle: application.job?.title ?? "Role",
      candidateEmail: application.candidate?.email ?? "Candidate",
      invitedAt: application.invited_at ?? null,
    }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Interviews</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          Track scheduled interviews and follow-ups for your roles.
        </p>
      </div>
      <Suspense fallback={<RecruiterInterviewsLoading />}>
        <RecruiterInterviewsClient
          sessions={interviewItems}
          invites={pendingInvites}
        />
      </Suspense>
    </div>
  );
}
