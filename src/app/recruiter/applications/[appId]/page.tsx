import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SkeletonCard,
} from "@/components/ui";
import { getSessionPayload } from "@/lib/auth/session";
import { getRecruiterApplicationDetail } from "@/lib/applications/service";
import { listInterviewSessionsForApplication } from "@/lib/interviews/service";
import InviteActions from "../../jobs/[id]/applications/[appId]/InviteActions";
import ApplicationDetailClient from "./ApplicationDetailClient";
import EvaluationPanel from "./EvaluationPanel";
import ManualOverrideEditor from "./ManualOverrideEditor";

const ghostLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[--border] bg-white px-3 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }
  return new Date(value).toLocaleString();
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseBand(value: "parsed" | "partial" | "failed") {
  if (value === "parsed") {
    return { label: "Parsed", variant: "success" as const };
  }
  if (value === "partial") {
    return { label: "Partial", variant: "warning" as const };
  }
  return { label: "Failed", variant: "destructive" as const };
}

type InterviewAnswerEntry = {
  questionIndex: number;
  question: string;
  answer: string;
  feedback: string;
};

function FileIcon({ fileType }: { fileType: string | null }) {
  const isPdf = (fileType ?? "").toLowerCase().includes("pdf");
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700">
      {isPdf ? "PDF" : "DOCX"}
    </span>
  );
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: { appId: string };
}) {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  const {
    application,
    job,
    candidate,
    resume,
    resumeText,
    resumeAsset,
    manualOverrides,
    latestEvaluation,
  } = await getRecruiterApplicationDetail(params.appId, session.sub);

  const interviewSessions = await listInterviewSessionsForApplication(
    params.appId,
    session.sub
  );

  const parseStatusUi = parseBand(resumeAsset.parseStatus);
  const isPdf =
    (resumeAsset.fileType ?? "").toLowerCase().includes("pdf") ||
    (resumeAsset.fileName ?? "").toLowerCase().endsWith(".pdf");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Candidate Review
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {job?.title ?? "Role"} - {job?.department ?? "Department"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={ghostLinkClass} href="/recruiter/applications">
            Back to applications
          </Link>
          <Link
            className={ghostLinkClass}
            href={`/recruiter/jobs/${job?.id ?? ""}/applications`}
          >
            Job pipeline
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Profile</CardTitle>
              <CardDescription>
                Manual recruiter review before AI evaluation.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <ProfileRow
                  label="Name"
                  value={manualOverrides?.name ?? resume?.name ?? "Unknown"}
                />
                <ProfileRow
                  label="Email"
                  value={manualOverrides?.email ?? resume?.email ?? candidate.email}
                />
                <ProfileRow
                  label="Phone"
                  value={manualOverrides?.phone ?? resume?.phone ?? "Not provided"}
                />
                <ProfileRow
                  label="Location"
                  value={manualOverrides?.location ?? resume?.location ?? "Not provided"}
                />
                <ProfileRow
                  label="Experience"
                  value={
                    manualOverrides?.experience ??
                    (resume?.total_years_experience != null
                      ? `${resume.total_years_experience} years`
                      : "Not provided")
                  }
                />
                <ProfileRow
                  label="Application Status"
                  value={formatStatus(application.status)}
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(manualOverrides?.skills ?? resume?.skills ?? []).length ? (
                    (manualOverrides?.skills ?? resume?.skills ?? []).map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No skills extracted</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Education</p>
                <p className="mt-2 text-sm text-slate-700">
                  {manualOverrides?.education ??
                    ((resume?.education ?? [])
                      .map((item) => {
                        const entry = item as {
                          degree?: string | null;
                          field?: string | null;
                          institution?: string | null;
                        };
                        return [
                          entry.degree,
                          entry.field ? `in ${entry.field}` : null,
                          entry.institution,
                        ]
                          .filter(Boolean)
                          .join(" ");
                      })
                      .filter(Boolean)
                      .join(" | ") || "Not provided")}
                </p>
              </div>
            </CardContent>
          </Card>

          <ManualOverrideEditor
            applicationId={application.id}
            initialOverrides={manualOverrides}
          />

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Resume Viewer</CardTitle>
                  <CardDescription>
                    Original resume is always preserved and available.
                  </CardDescription>
                </div>
                <Badge variant={parseStatusUi.variant}>{parseStatusUi.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">
                  {resume ? "Resume parsed successfully." : "We were unable to fully extract structured information from this resume automatically. You can still review the original uploaded file below."}
                </p>
                <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <p>File uploaded successfully: Yes</p>
                  <p>File type: {resumeAsset.fileType ?? "Unknown"}</p>
                  <p>Uploaded: {formatDate(resumeAsset.uploadedAt)}</p>
                  <p>
                    Parse confidence: {resumeAsset.parseConfidence != null ? `${resumeAsset.parseConfidence}%` : "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <FileIcon fileType={resumeAsset.fileType} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {resumeAsset.fileName ?? "Uploaded resume"}
                    </p>
                    <p className="text-xs text-slate-500">{resumeAsset.fileType ?? "Unknown type"}</p>
                  </div>
                </div>
                {resumeAsset.downloadUrl ? (
                  <a
                    href={resumeAsset.downloadUrl}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-[--accent] px-4 text-sm font-medium text-white transition-colors hover:bg-[--accent-hover]"
                  >
                    Download Resume
                  </a>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {resumeAsset.previewUrl && isPdf ? (
                  <iframe
                    src={resumeAsset.previewUrl}
                    title="Resume preview"
                    className="h-[680px] w-full"
                  />
                ) : resumeText ? (
                  <div className="max-h-[680px] overflow-auto p-4">
                    <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">
                      Document preview
                    </p>
                    <pre className="whitespace-pre-wrap text-sm text-slate-700">
                      {resumeText}
                    </pre>
                  </div>
                ) : (
                  <div className="p-6 text-sm text-slate-600">
                    Preview is unavailable for this format in-browser. Use download to review the original file.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interview Sessions</CardTitle>
              <CardDescription>
                Mock interview progress and feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              {interviewSessions.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-slate-600">
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
                      className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Session {sessionItem.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Started {formatDate(sessionItem.created_at)}
                          </p>
                        </div>
                        <Badge>{formatStatus(sessionItem.status)}</Badge>
                      </div>

                      <div className="mt-3 flex flex-col gap-2">
                        {questions.length === 0 ? (
                          <span className="text-xs text-slate-500">
                            No questions recorded.
                          </span>
                        ) : (
                          questions.map((question, index) => {
                            const entry = answerMap.get(index);
                            return (
                              <details
                                key={`${sessionItem.id}-${index}`}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                              >
                                <summary className="cursor-pointer text-xs font-medium text-slate-900">
                                  {question}
                                </summary>
                                {entry ? (
                                  <div className="mt-2 text-xs text-slate-700">
                                    <p className="text-slate-500">Answer</p>
                                    <p className="mt-1">{entry.answer}</p>
                                    <p className="mt-2 text-slate-500">Feedback</p>
                                    <p className="mt-1">{entry.feedback}</p>
                                  </div>
                                ) : (
                                  <p className="mt-2 text-xs text-slate-500">
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

        <aside className="flex flex-col gap-4">
          <EvaluationPanel
            applicationId={application.id}
            initialEvaluation={latestEvaluation}
          />

          <Card>
            <CardHeader>
              <CardTitle>Next Step</CardTitle>
              <CardDescription>Invite or update status.</CardDescription>
            </CardHeader>
            <CardContent>
              <InviteActions
                applicationId={application.id}
                status={application.status}
                invitedAt={application.invited_at}
              />
            </CardContent>
          </Card>

          <Suspense fallback={<SkeletonCard />}>
            <ApplicationDetailClient applicationId={application.id} />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value}</p>
    </div>
  );
}
