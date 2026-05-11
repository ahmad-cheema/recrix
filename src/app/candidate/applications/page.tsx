import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/auth/session";
import { listCandidateApplications } from "@/lib/applications/service";
import { listInterviewSessionsForApplications } from "@/lib/interviews/service";
import CandidateApplicationsClient from "./CandidateApplicationsClient";

export default async function CandidateApplicationsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  const applications = await listCandidateApplications(session.sub);
  const sessions = await listInterviewSessionsForApplications(
    applications.map((application) => application.id)
  );

  const latestSessionByApplication = sessions.reduce(
    (acc, sessionItem) => {
      const existing = acc[sessionItem.application_id];
      if (!existing) {
        acc[sessionItem.application_id] = sessionItem;
        return acc;
      }

      const existingDate = new Date(existing.created_at ?? 0).getTime();
      const nextDate = new Date(sessionItem.created_at ?? 0).getTime();

      if (nextDate > existingDate) {
        acc[sessionItem.application_id] = sessionItem;
      }

      return acc;
    },
    {} as Record<string, typeof sessions[number]>
  );

  return (
    <CandidateApplicationsClient
      applications={applications}
      sessions={latestSessionByApplication}
    />
  );
}
