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

const ghostLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[--border] px-3 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:border-[--text-muted] hover:text-[--text-primary]";

const columns = [
  { label: "New", statuses: ["submitted"] },
  { label: "Review", statuses: ["manual_review"] },
  { label: "Shortlisted", statuses: ["reviewed"] },
  { label: "Interview", statuses: ["interview_scheduled"] },
  { label: "Rejected", statuses: ["rejected"] },
] as const;

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function RecruiterApplicantsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  const applications = await listRecruiterApplications(session.sub);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Applicant pipeline</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          Track candidates across every stage and focus on top matches.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {columns.map((column) => {
          const items = applications.filter((application) =>
            (column.statuses as readonly string[]).includes(application.status)
          );

          return (
            <Card key={column.label} className="h-full">
              <CardHeader>
                <CardTitle className="text-base">{column.label}</CardTitle>
                <CardDescription>{items.length} candidates</CardDescription>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-4 text-xs text-[--text-secondary]">
                    No candidates yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {items.map((application) => (
                      <div
                        key={application.id}
                        className="rounded-lg border border-[--border] bg-[--surface-raised] p-3"
                      >
                        <p className="text-sm font-medium text-[--text-primary]">
                          {application.candidate?.email ?? "Candidate"}
                        </p>
                        <p className="text-xs text-[--text-secondary]">
                          {application.job?.title ?? "Role"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge>{formatStatus(application.status)}</Badge>
                          {application.match_score != null ? (
                            <ScoreBadge score={application.match_score} />
                          ) : null}
                        </div>
                        <Link
                          className={`${ghostLinkClass} mt-3`}
                          href={`/recruiter/applications/${application.id}`}
                        >
                          Open profile
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
