import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { getSessionPayload } from "@/lib/auth/session";
import { listRecruiterJobs } from "@/lib/jobs/service";

const primaryLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-[--text-primary] px-4 py-2 text-sm font-medium text-[--background] transition-colors hover:bg-[--accent-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";
const ghostLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[--border] px-4 py-2 text-sm font-medium text-[--text-secondary] transition-colors hover:border-[--text-muted] hover:text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }
  return new Date(value).toLocaleDateString();
}

export default async function RecruiterDashboardPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  const jobs = await listRecruiterJobs(session.sub);
  const totalJobs = jobs.length;

  return (
    <div className="min-h-screen bg-[--background] px-6 py-10 text-[--text-primary]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Recruiter dashboard</h1>
            <p className="mt-2 text-sm text-[--text-secondary]">
              Track listings, review applicants, and schedule interviews.
            </p>
          </div>
          <Link className={primaryLinkClass} href="/recruiter/jobs/new">
            Post new job
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total Jobs", value: totalJobs },
            { label: "Total Applications", value: 0 },
            { label: "Pending Review", value: 0 },
            { label: "Scheduled Interviews", value: 0 },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle>{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Recent jobs</CardTitle>
                <CardDescription>Most recent listings you published.</CardDescription>
              </div>
              <Link className={ghostLinkClass} href="/recruiter/jobs">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
                No jobs yet. Create your first listing to get started.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {jobs.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[--text-primary]">
                        {job.title}
                      </p>
                      <p className="text-xs text-[--text-secondary]">
                        {job.department} · {job.location} · {formatDate(job.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[--text-secondary]">
                      <span>0 applications</span>
                      <Badge>{job.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
