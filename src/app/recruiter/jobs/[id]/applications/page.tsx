import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScoreBadge,
} from "@/components/ui";
import { getSessionPayload } from "@/lib/auth/session";
import { listApplicationsForJob } from "@/lib/applications/service";

const ghostLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[--border] px-3 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:border-[--text-muted] hover:text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }
  return new Date(value).toLocaleDateString();
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function RecruiterApplicationsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  const { job, applications } = await listApplicationsForJob(
    params.id,
    session.sub
  );

  return (
    <div className="min-h-screen bg-[--background] px-6 py-10 text-[--text-primary]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Applications</h1>
            <p className="mt-2 text-sm text-[--text-secondary]">
              {job.title}
            </p>
          </div>
          <Link className={ghostLinkClass} href="/recruiter/jobs">
            Back to jobs
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent applicants</CardTitle>
            <CardDescription>
              {applications.length} total application
              {applications.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
                No applications yet. Once candidates apply, they will show up here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-[--text-muted]">
                      <th className="px-3">Candidate</th>
                      <th className="px-3">Match Score</th>
                      <th className="px-3">Status</th>
                      <th className="px-3">Applied</th>
                      <th className="px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((application) => (
                      <tr
                        key={application.id}
                        className="rounded-lg border border-[--border] bg-[--surface-raised]"
                      >
                        <td className="px-3 py-3">
                          <p className="font-medium text-[--text-primary]">
                            {application.candidate?.email ?? "Unknown"}
                          </p>
                          {application.risk_evaluation ? (
                            <p className="mt-1 text-xs text-[--text-muted]">
                              {application.risk_evaluation}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-3">
                          {application.match_score != null ? (
                            <ScoreBadge score={application.match_score} />
                          ) : (
                            <span className="text-xs text-[--text-muted]">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <Badge>{formatStatus(application.status)}</Badge>
                        </td>
                        <td className="px-3 py-3 text-[--text-secondary]">
                          {formatDate(application.created_at)}
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            className={ghostLinkClass}
                            href={`/recruiter/jobs/${job.id}/applications/${application.id}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
