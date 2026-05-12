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
import { listCandidateApplications } from "@/lib/applications/service";
import { listInterviewSessionsForApplications } from "@/lib/interviews/service";
import { listActiveJobs } from "@/lib/jobs/service";

const primaryLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-[--text-primary] px-4 py-2 text-sm font-medium text-[--background] transition-colors hover:bg-[--accent-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";
const ghostLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[--border] px-4 py-2 text-sm font-medium text-[--text-secondary] transition-colors hover:border-[--text-muted] hover:text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function CandidateDashboardPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  const applications = await listCandidateApplications(session.sub);
  const sessions = await listInterviewSessionsForApplications(
    applications.map((application) => application.id)
  );
  const jobs = await listActiveJobs();

  const inReview = applications.filter(
    (application) =>
      application.status === "submitted" || application.status === "manual_review"
  ).length;
  const interviewsScheduled = applications.filter(
    (application) => application.status === "interview_scheduled"
  ).length;
  const completedInterviews = sessions.filter(
    (sessionItem) => sessionItem.status === "completed"
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            Track your applications and prep for upcoming interviews.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={ghostLinkClass} href="/candidate/applications">
            View tracker
          </Link>
          <Link className={primaryLinkClass} href="/candidate/jobs">
            Browse jobs
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Applications", value: applications.length },
          { label: "In review", value: inReview },
          { label: "Interviews", value: interviewsScheduled },
          { label: "Completed", value: completedInterviews },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle>{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent applications</CardTitle>
            <CardDescription>Latest roles you applied for.</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
                Apply to your first job to get started.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {applications.slice(0, 5).map((application) => (
                  <div
                    key={application.id}
                    className="rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[--text-primary]">
                          {application.job?.title ?? "Role"}
                        </p>
                        <p className="text-xs text-[--text-secondary]">
                          {application.job?.department} · {application.job?.location}
                        </p>
                      </div>
                      <Badge>{formatStatus(application.status)}</Badge>
                    </div>
                    {application.match_score != null ? (
                      <div className="mt-2">
                        <ScoreBadge score={application.match_score} />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended roles</CardTitle>
            <CardDescription>Fresh roles that match your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
                No open roles yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {jobs.slice(0, 4).map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[--text-primary]">
                        {job.title}
                      </p>
                      <p className="text-xs text-[--text-secondary]">
                        {job.department} · {job.location}
                      </p>
                    </div>
                    <Badge>{job.experience_level}</Badge>
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
