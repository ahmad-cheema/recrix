import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScoreRing,
} from "@/components/ui";
import { getSessionPayload } from "@/lib/auth/session";
import { getRecruiterApplicationDetail } from "@/lib/applications/service";
import { listInterviewSessionsForApplication } from "@/lib/interviews/service";
import InviteActions from "./InviteActions";

const ghostLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[--border] px-3 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:border-[--text-muted] hover:text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }
  return new Date(value).toLocaleDateString();
}

type InterviewAnswerEntry = {
  questionIndex: number;
  question: string;
  answer: string;
  feedback: string;
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string; appId: string };
}) {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  const { application, job, candidate, resume, resumeText } =
    await getRecruiterApplicationDetail(params.appId, session.sub);
  const interviewSessions = await listInterviewSessionsForApplication(
    params.appId,
    session.sub
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Application detail</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">{job.title}</p>
        </div>
        <Link
          className={ghostLinkClass}
          href={`/recruiter/jobs/${job.id}/applications`}
        >
          Back to applications
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Candidate overview</CardTitle>
              <CardDescription>{candidate.email}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 text-sm text-[--text-secondary]">
              <Badge>{formatStatus(application.status)}</Badge>
              <span>Applied {formatDate(application.created_at)}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parsed resume</CardTitle>
              <CardDescription>Structured highlights from the resume.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 text-sm">
              {resume ? (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[--text-muted]">
                      Skills
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(resume.skills ?? []).length ? (
                        resume.skills.map((skill) => (
                          <Badge key={skill}>{skill}</Badge>
                        ))
                      ) : (
                        <span className="text-xs text-[--text-muted]">None listed</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-[--text-muted]">
                      Experience
                    </p>
                    <div className="mt-2 flex flex-col gap-3">
                      {(resume.work_experience ?? []).length ? (
                        resume.work_experience.map((role, index) => (
                          <div
                            key={`${role.company ?? "role"}-${index}`}
                            className="rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3"
                          >
                            <p className="text-sm font-medium text-[--text-primary]">
                              {role.title || "Role"} · {role.company || "Unknown"}
                            </p>
                            <p className="text-xs text-[--text-muted]">
                              {role.duration || "Duration not provided"}
                            </p>
                            {role.description ? (
                              <p className="mt-2 text-xs text-[--text-secondary]">
                                {role.description}
                              </p>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-[--text-muted]">
                          No experience listed.
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-[--text-muted]">
                      Education
                    </p>
                    <div className="mt-2 flex flex-col gap-1 text-[--text-secondary]">
                      {(resume.education ?? []).length ? (
                        resume.education.map((entry) => (
                          <span key={entry}>{entry}</span>
                        ))
                      ) : (
                        <span className="text-xs text-[--text-muted]">
                          No education listed.
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3 rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
                  <p>
                    Resume parsing failed. Review the uploaded resume manually.
                  </p>
                  {resumeText ? (
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-[--border] bg-[--surface] p-3 text-xs text-[--text-secondary]">
                      {resumeText}
                    </pre>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interview sessions</CardTitle>
              <CardDescription>Mock interview progress and feedback.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              {interviewSessions.length === 0 ? (
                <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
                  No interview sessions yet.
                </div>
              ) : (
                interviewSessions.map((sessionItem) => {
                  const questions =
                    (sessionItem.questions as string[] | null) ?? [];
                  const answers =
                    (sessionItem.answers as InterviewAnswerEntry[] | null) ?? [];
                  const answerMap = new Map(
                    answers.map((entry) => [entry.questionIndex, entry])
                  );

                  return (
                    <div
                      key={sessionItem.id}
                      className="rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[--text-primary]">
                            Session {sessionItem.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-[--text-muted]">
                            Started {formatDate(sessionItem.created_at)}
                          </p>
                        </div>
                        <Badge>{formatStatus(sessionItem.status)}</Badge>
                      </div>

                      <div className="mt-3 flex flex-col gap-2">
                        {questions.length === 0 ? (
                          <span className="text-xs text-[--text-muted]">
                            No questions recorded.
                          </span>
                        ) : (
                          questions.map((question, index) => {
                            const entry = answerMap.get(index);
                            return (
                              <details
                                key={`${sessionItem.id}-${index}`}
                                className="rounded-lg border border-[--border-subtle] bg-[--surface] px-3 py-2"
                              >
                                <summary className="cursor-pointer text-xs font-medium text-[--text-primary]">
                                  {question}
                                </summary>
                                {entry ? (
                                  <div className="mt-2 text-xs text-[--text-secondary]">
                                    <p className="text-[--text-muted]">Answer</p>
                                    <p className="mt-1">{entry.answer}</p>
                                    <p className="mt-2 text-[--text-muted]">Feedback</p>
                                    <p className="mt-1">{entry.feedback}</p>
                                  </div>
                                ) : (
                                  <p className="mt-2 text-xs text-[--text-muted]">
                                    No answer yet.
                                  </p>
                                )}
                              </details>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Match score</CardTitle>
              <CardDescription>AI-generated fit for this role.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {application.match_score != null ? (
                <ScoreRing score={application.match_score} />
              ) : (
                <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] px-4 py-6 text-sm text-[--text-secondary]">
                  Score unavailable
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk evaluation</CardTitle>
              <CardDescription>Potential concerns flagged by AI.</CardDescription>
            </CardHeader>
            <CardContent>
              <details className="rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3 text-sm text-[--text-secondary]">
                <summary className="cursor-pointer text-[--text-primary]">
                  View risk evaluation
                </summary>
                <p className="mt-2 text-xs text-[--text-muted]">
                  {application.risk_evaluation ?? "No risk evaluation available."}
                </p>
              </details>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interview invitation</CardTitle>
              <CardDescription>Send the mock interview link to the candidate.</CardDescription>
            </CardHeader>
            <CardContent>
              <InviteActions
                applicationId={application.id}
                status={application.status}
                invitedAt={application.invited_at}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
