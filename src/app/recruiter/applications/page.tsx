import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/auth/session";
import { listRecruiterApplications } from "@/lib/applications/service";
import RecruiterApplicationsClient from "./RecruiterApplicationsClient";
import RecruiterApplicationsLoading from "./loading";

export default async function RecruiterApplicationsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  const applications = await listRecruiterApplications(session.sub);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Applications</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          Review candidates, update statuses, and schedule interviews.
        </p>
      </div>
      <Suspense fallback={<RecruiterApplicationsLoading />}>
        <RecruiterApplicationsClient applications={applications} />
      </Suspense>
    </div>
  );
}
