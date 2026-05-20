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
import { getRecruiterApplicationStats } from "@/lib/applications/service";
import { listRecruiterJobs } from "@/lib/jobs/service";

const primaryLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-[--accent] px-4 py-2 text-sm font-medium text-[--background] transition-colors hover:bg-[--accent-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";
const ghostLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[--border] px-4 py-2 text-sm font-medium text-[--text-secondary] transition-colors hover:border-[--text-muted] hover:bg-[--surface-raised] hover:text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";

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
  const { total, pendingReview, scheduled, byJobId } =
    await getRecruiterApplicationStats(session.sub);

  return (
    <div className="flex flex-col gap-8">
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

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="flex flex-col gap-6 lg:col-span-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Jobs", value: totalJobs },
              { label: "Total Applications", value: total },
              { label: "Pending Review", value: pendingReview },
              { label: "Scheduled Interviews", value: scheduled },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader>
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle>{stat.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

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
                        <span>{byJobId[job.id] ?? 0} applications</span>
                        <Badge className="status-pulse">{job.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Keep hiring momentum moving.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link className={primaryLinkClass} href="/recruiter/jobs/new">
                Post new job
              </Link>
              <Link className={ghostLinkClass} href="/recruiter/applicants">
                Review applicants
              </Link>
              <Link className={ghostLinkClass} href="/recruiter/screening">
                Screening queue
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline snapshot</CardTitle>
              <CardDescription>Current applicant workflow.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-[--text-secondary]">
              <div className="flex items-center justify-between">
                <span>Pending review</span>
                <Badge className="status-pulse">{pendingReview}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Interviews scheduled</span>
                <Badge className="status-pulse">{scheduled}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Total applications</span>
                <Badge>{total}</Badge>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
