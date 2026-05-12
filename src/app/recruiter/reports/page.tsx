import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { getSessionPayload } from "@/lib/auth/session";
import { listRecruiterApplications } from "@/lib/applications/service";

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function RecruiterReportsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  const applications = await listRecruiterApplications(session.sub);
  const totalApplications = applications.length;
  const averageScore = Math.round(
    applications.reduce((acc, item) => acc + (item.match_score ?? 0), 0) /
      (applications.filter((item) => item.match_score != null).length || 1)
  );

  const statusCounts = applications.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const jobCounts = applications.reduce((acc, item) => {
    if (!item.job?.id) {
      return acc;
    }
    const entry = acc[item.job.id] ?? {
      title: item.job.title,
      department: item.job.department,
      count: 0,
    };
    entry.count += 1;
    acc[item.job.id] = entry;
    return acc;
  }, {} as Record<string, { title: string; department: string; count: number }>);

  const topJobs = Object.values(jobCounts).sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Reports & analytics</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          Monitor applicant volume, status breakdowns, and role performance.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total applications</CardDescription>
            <CardTitle>{totalApplications}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Average match score</CardDescription>
            <CardTitle>{averageScore}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active roles</CardDescription>
            <CardTitle>{Object.keys(jobCounts).length}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status breakdown</CardTitle>
            <CardDescription>Where applicants are in the funnel.</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(statusCounts).length === 0 ? (
              <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
                No applicant data yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3 text-sm"
                  >
                    <span className="text-[--text-secondary]">
                      {formatStatus(status)}
                    </span>
                    <span className="font-medium text-[--text-primary]">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role performance</CardTitle>
            <CardDescription>Applications per job listing.</CardDescription>
          </CardHeader>
          <CardContent>
            {topJobs.length === 0 ? (
              <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
                Publish a role to see activity here.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {topJobs.slice(0, 6).map((job) => (
                  <div
                    key={job.title}
                    className="flex items-center justify-between rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-[--text-primary]">
                        {job.title}
                      </p>
                      <p className="text-xs text-[--text-secondary]">
                        {job.department}
                      </p>
                    </div>
                    <span className="text-sm text-[--text-primary]">
                      {job.count} apps
                    </span>
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
