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
import { listRecruiterApplications } from "@/lib/applications/service";

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

export default async function RecruiterScreeningPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  const applications = await listRecruiterApplications(session.sub);
  const screening = applications.filter(
    (application) =>
      application.status === "submitted" || application.status === "manual_review"
  );
  const sorted = [...screening].sort((a, b) => {
    const scoreA = a.match_score ?? -1;
    const scoreB = b.match_score ?? -1;
    return scoreB - scoreA;
  });

  const averageScore =
    screening.reduce((acc, item) => acc + (item.match_score ?? 0), 0) /
    (screening.filter((item) => item.match_score != null).length || 1);
  const highMatch = screening.filter(
    (item) => (item.match_score ?? 0) >= 75
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Screening queue</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            Prioritize new applicants and move top matches into interviews.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={ghostLinkClass} href="/recruiter/applicants">
            View pipeline
          </Link>
          <Link className={primaryLinkClass} href="/recruiter/jobs/new">
            Post a job
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>In Screening</CardDescription>
            <CardTitle>{screening.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>High Match Candidates</CardDescription>
            <CardTitle>{highMatch}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Average Match Score</CardDescription>
            <CardTitle>{Math.round(averageScore)}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Priority reviews</CardTitle>
          <CardDescription>
            Review these applicants first based on score and recency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
              No new applicants to screen right now.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sorted.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[--text-primary]">
                      {application.candidate?.email ?? "Candidate"}
                    </p>
                    <p className="text-xs text-[--text-secondary]">
                      {application.job?.title ?? "Role"} ·{" "}
                      {application.job?.department ?? ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{formatStatus(application.status)}</Badge>
                    {application.match_score != null ? (
                      <ScoreBadge score={application.match_score} />
                    ) : null}
                    {application.job?.id ? (
                      <Link
                        className={ghostLinkClass}
                        href={`/recruiter/jobs/${application.job.id}/applications/${application.id}`}
                      >
                        Review
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
