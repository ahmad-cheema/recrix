import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import JobForm from "@/components/jobs/JobForm";
import { getSessionPayload } from "@/lib/auth/session";
import { getJobById } from "@/lib/jobs/service";
import { listApplicationsForJob } from "@/lib/applications/service";

const ghostLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[--border] px-3 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:border-[--text-muted] hover:bg-[--surface-raised] hover:text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";

export default async function RecruiterJobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  const job = await getJobById(params.id);
  const { applications } = await listApplicationsForJob(params.id, session.sub);

  const pendingReview = applications.filter(
    (application) =>
      application.status === "submitted" ||
      application.status === "manual_review"
  ).length;
  const scheduled = applications.filter(
    (application) => application.status === "interview_scheduled"
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Job detail</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            {job.title} · {job.department}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={ghostLinkClass} href="/recruiter/jobs">
            Back to jobs
          </Link>
          <Link
            className={ghostLinkClass}
            href={`/recruiter/jobs/${job.id}/applications`}
          >
            View applications
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <JobForm mode="edit" initialJob={job} />
        </section>
        <aside className="flex flex-col gap-4 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Application stats</CardTitle>
              <CardDescription>Live pipeline snapshot.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-[--text-secondary]">
              <div className="flex items-center justify-between">
                <span>Total applications</span>
                <Badge>{applications.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Pending review</span>
                <Badge>{pendingReview}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Interviews scheduled</span>
                <Badge>{scheduled}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Current job visibility.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[--text-secondary]">
              <Badge>{job.status}</Badge>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
