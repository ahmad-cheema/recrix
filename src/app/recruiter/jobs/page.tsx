import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { getSessionPayload } from "@/lib/auth/session";
import { getRecruiterApplicationStats } from "@/lib/applications/service";
import { listRecruiterJobs } from "@/lib/jobs/service";

const primaryLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-[--text-primary] px-4 py-2 text-sm font-medium text-[--background] transition-colors hover:bg-[--accent-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";
const ghostLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[--border] px-3 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:border-[--text-muted] hover:text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }
  return new Date(value).toLocaleDateString();
}

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

      <Card>
        <CardHeader>
          <CardTitle>All listings</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
              No jobs yet. Post a job to start receiving applications.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[--text-muted]">
                    <th className="px-3">Title</th>
                    <th className="px-3">Department</th>
                    <th className="px-3">Applications</th>
                    <th className="px-3">Status</th>
                    <th className="px-3">Created</th>
                    <th className="px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className="rounded-lg border border-[--border] bg-[--surface-raised]"
                    >
                      <td className="px-3 py-3 font-medium text-[--text-primary]">
                        {job.title}
                      </td>
                      <td className="px-3 py-3 text-[--text-secondary]">
                        {job.department}
                      </td>
                      <td className="px-3 py-3 text-[--text-secondary]">
                        {byJobId[job.id] ?? 0}
                      </td>
                      <td className="px-3 py-3">
                        <Badge>{job.status}</Badge>
                      </td>
                      <td className="px-3 py-3 text-[--text-secondary]">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          className={ghostLinkClass}
                          href={`/recruiter/jobs/${job.id}/applications`}
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
  );
}
