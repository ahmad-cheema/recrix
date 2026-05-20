import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@/components/ui";
import { getSessionPayload } from "@/lib/auth/session";
import { listCandidateApplications } from "@/lib/applications/service";
import { listInterviewSessionsForApplications } from "@/lib/interviews/service";

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const primaryLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[--accent] px-4 py-2 text-sm font-medium text-[--background] transition-colors hover:bg-[--accent-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";

const ghostLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[--border] px-3 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:border-[--text-muted] hover:text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";

export default async function CandidateInterviewsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  const applications = await listCandidateApplications(session.sub);
  const interviewEligible = applications.filter(
    (a) => a.status === "interview_scheduled"
  );
  const appIds = applications.map((a) => a.id);
  const interviewSessions = await listInterviewSessionsForApplications(appIds);

  // Build a map from application ID to application
  const appMap = new Map(applications.map((a) => [a.id, a]));

  // Group sessions by status
  const activeSessions = interviewSessions.filter(
    (s) => s.status === "in_progress"
  );
  const completedSessions = interviewSessions.filter(
    (s) => s.status === "completed"
  );
  const pendingInvites = interviewEligible.filter(
    (a) => !interviewSessions.some((s) => s.application_id === a.id)
  );

  const totalSessions = interviewSessions.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Interviews</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          Prepare, practice, and review your mock interviews.
        </p>
      </div>

      {/* Stats row */}
      <section className="grid gap-4 md:grid-cols-4" aria-label="Interview statistics">
        <Card>
          <CardHeader>
            <CardDescription>Pending Invites</CardDescription>
            <CardTitle>{pendingInvites.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>In Progress</CardDescription>
            <CardTitle>{activeSessions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Completed</CardDescription>
            <CardTitle>{completedSessions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Sessions</CardDescription>
            <CardTitle>{totalSessions}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      {/* Pending invites */}
      {pendingInvites.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Ready to start</CardTitle>
            <CardDescription>
              These roles are awaiting your mock interview. Start practising now.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pendingInvites.map((app) => (
              <div
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[--text-primary]">
                    {app.job?.title ?? "Role"}
                  </p>
                  <p className="text-xs text-[--text-secondary]">
                    {app.job?.department} · {app.job?.location}
                  </p>
                </div>
                <div className="flex flex-col gap-2 rounded-lg border border-[--border-subtle] bg-[--surface] px-3 py-2 text-xs text-[--text-secondary]">
                  <p className="font-medium text-[--text-primary]">Prep tips:</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Review the job description carefully</li>
                    <li>Prepare STAR-method examples</li>
                    <li>Practice speaking your answers aloud</li>
                  </ul>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Active sessions */}
      {activeSessions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>In progress</CardTitle>
            <CardDescription>
              Resume where you left off.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {activeSessions.map((sessionItem) => {
              const app = appMap.get(sessionItem.application_id);
              const questions = (sessionItem.questions as string[] | null) ?? [];
              const answers = (sessionItem.answers as Array<{ questionIndex: number }> | null) ?? [];
              const progress = questions.length
                ? Math.round((answers.length / questions.length) * 100)
                : 0;

              return (
                <div
                  key={sessionItem.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[--accent]/30 bg-[--surface-raised] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[--text-primary]">
                      {app?.job?.title ?? "Role"}
                    </p>
                    <p className="text-xs text-[--text-secondary]">
                      {answers.length} of {questions.length} questions answered · {progress}% complete
                    </p>
                    <p className="mt-1 text-xs text-[--text-muted]">
                      Started {formatDate(sessionItem.created_at)}
                    </p>
                  </div>
                  <Link className={primaryLinkClass} href={`/candidate/interview/${sessionItem.id}`}>
                    Resume
                  </Link>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* Completed sessions */}
      {completedSessions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>
              Review your past interviews and feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {completedSessions.map((sessionItem) => {
              const app = appMap.get(sessionItem.application_id);

              return (
                <div
                  key={sessionItem.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[--text-primary]">
                      {app?.job?.title ?? "Role"}
                    </p>
                    <p className="text-xs text-[--text-muted]">
                      Completed {formatDate(sessionItem.updated_at ?? sessionItem.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Completed</Badge>
                    <Link className={ghostLinkClass} href={`/candidate/interview/${sessionItem.id}`}>
                      Review
                    </Link>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* Empty state */}
      {totalSessions === 0 && pendingInvites.length === 0 ? (
        <EmptyState
          title="No interviews yet"
          description="Once a recruiter invites you to interview, your mock practice sessions will appear here."
          actionLabel="View applications"
          actionHref="/candidate/applications"
        />
      ) : null}
    </div>
  );
}
