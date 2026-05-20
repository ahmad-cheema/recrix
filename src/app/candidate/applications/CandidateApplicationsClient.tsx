"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ScoreBadge,
  Spinner,
} from "@/components/ui";

type Application = {
  id: string;
  status: string;
  match_score: number | null;
  risk_evaluation: string | null;
  created_at: string | null;
  job: {
    id: string;
    title: string;
    department: string;
    location: string;
    employment_type: string;
    experience_level: string;
  } | null;
};

type Session = {
  id: string;
  status: string;
  application_id: string;
};

type ViewMode = "cards" | "timeline";

const ALL_STATUSES = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "manual_review", label: "In Review" },
  { value: "reviewed", label: "Reviewed" },
  { value: "interview_scheduled", label: "Interview" },
  { value: "rejected", label: "Rejected" },
] as const;

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
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getNextStep(status: string): string {
  switch (status) {
    case "submitted":
      return "Your application is being reviewed by the recruiter. You'll be notified of any updates.";
    case "manual_review":
      return "The recruiter is manually reviewing your resume. This usually takes 1–3 business days.";
    case "reviewed":
      return "You've been shortlisted! Expect an interview invitation soon.";
    case "interview_scheduled":
      return "Your interview is scheduled. Start a mock interview to prepare.";
    case "rejected":
      return "This application was not selected. Keep applying to other roles.";
    default:
      return "Status update pending.";
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "submitted":
      return "default" as const;
    case "manual_review":
      return "warning" as const;
    case "reviewed":
      return "success" as const;
    case "interview_scheduled":
      return "success" as const;
    case "rejected":
      return "destructive" as const;
    default:
      return "default" as const;
  }
}

const timelineDot: Record<string, string> = {
  submitted: "border-[--text-muted]",
  manual_review: "border-[--warning]",
  reviewed: "border-[--success]",
  interview_scheduled: "border-[--accent]",
  rejected: "border-[--destructive]",
};

export default function CandidateApplicationsClient({
  applications,
  sessions,
}: {
  applications: Application[];
  sessions: Record<string, Session>;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [viewMode, setViewMode] = React.useState<ViewMode>("cards");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const filteredApps = React.useMemo(() => {
    if (statusFilter === "all") {
      return applications;
    }
    return applications.filter((a) => a.status === statusFilter);
  }, [applications, statusFilter]);

  async function startInterview(applicationId: string) {
    const existingSession = sessions[applicationId];
    if (existingSession) {
      router.push(`/candidate/interview/${existingSession.id}`);
      return;
    }

    setLoadingId(applicationId);
    setError(null);

    try {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });

      const result = (await response.json().catch(() => null)) as
        | { session?: { id: string }; error?: string }
        | null;

      if (!response.ok) {
        setError(result?.error ?? "Unable to start interview.");
        return;
      }

      if (result?.session?.id) {
        router.push(`/candidate/interview/${result.session.id}`);
      }
    } catch {
      setError("Unable to start interview.");
    } finally {
      setLoadingId(null);
    }
  }

  function getActionLabel(application: Application) {
    const session = sessions[application.id];
    if (!session) {
      return "Start Practice Interview";
    }
    return session.status === "completed"
      ? "View Interview"
      : "Resume Interview";
  }

  function renderApplicationCard(application: Application) {
    const session = sessions[application.id];
    const isExpanded = expandedId === application.id;
    const canInterview =
      session || application.status === "interview_scheduled";

    return (
      <Card key={application.id}>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>{application.job?.title ?? "Role"}</CardTitle>
              <CardDescription>
                {application.job?.department} · {application.job?.location}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[--text-muted]">
                {formatDate(application.created_at)}
              </span>
              <Badge variant={getStatusVariant(application.status)}>
                {formatStatus(application.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{application.job?.employment_type ?? ""}</Badge>
              <Badge>{application.job?.experience_level ?? ""}</Badge>
              {application.match_score != null ? (
                <ScoreBadge score={application.match_score} />
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setExpandedId(isExpanded ? null : application.id)
                }
                className="text-xs text-[--text-secondary] hover:text-[--text-primary]"
              >
                {isExpanded ? "Less" : "Details"}
              </button>
              <Button
                size="sm"
                onClick={() => startInterview(application.id)}
                disabled={!canInterview || loadingId === application.id}
              >
                {loadingId === application.id ? (
                  <Spinner size="sm" />
                ) : (
                  getActionLabel(application)
                )}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 flex flex-col gap-3 rounded-lg border border-[--border] bg-[--surface-raised] p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[--text-muted]">
                      Next Step
                    </p>
                    <p className="mt-1 text-sm text-[--text-secondary]">
                      {getNextStep(application.status)}
                    </p>
                  </div>
                  {application.risk_evaluation ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[--text-muted]">
                        AI Assessment
                      </p>
                      <p className="mt-1 text-sm text-[--text-secondary]">
                        {application.risk_evaluation}
                      </p>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  }

  function renderTimeline() {
    return (
      <div className="relative pl-8">
        <div className="absolute left-3 top-2 h-[calc(100%-16px)] w-px bg-[--border]" />
        <div className="flex flex-col gap-6">
          {filteredApps.map((application) => {
            const session = sessions[application.id];
            const canInterview =
              session || application.status === "interview_scheduled";
            const dotColor = timelineDot[application.status] ?? "border-[--text-muted]";

            return (
              <div key={application.id} className="relative">
                <div
                  className={`absolute -left-5 top-1 h-3.5 w-3.5 rounded-full border-2 bg-[--surface] ${dotColor}`}
                />
                <div className="rounded-xl border border-[--border] bg-[--surface] px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[--text-primary]">
                        {application.job?.title ?? "Role"}
                      </p>
                      <p className="text-xs text-[--text-secondary]">
                        {application.job?.department} ·{" "}
                        {application.job?.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {application.match_score != null ? (
                        <ScoreBadge score={application.match_score} />
                      ) : null}
                      <Badge variant={getStatusVariant(application.status)}>
                        {formatStatus(application.status)}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-[--text-muted]">
                    Applied {formatDate(application.created_at)} ·{" "}
                    {getNextStep(application.status)}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => startInterview(application.id)}
                      disabled={
                        !canInterview || loadingId === application.id
                      }
                    >
                      {loadingId === application.id ? (
                        <Spinner size="sm" />
                      ) : (
                        getActionLabel(application)
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your applications</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            Track match scores, view next steps, and start mock interviews.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "cards"
                ? "border-[--accent] text-[--accent]"
                : "border-[--border] text-[--text-secondary] hover:text-[--text-primary]"
            }`}
            aria-pressed={viewMode === "cards"}
          >
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "timeline"
                ? "border-[--accent] text-[--accent]"
                : "border-[--border] text-[--text-secondary] hover:text-[--text-primary]"
            }`}
            aria-pressed={viewMode === "timeline"}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {ALL_STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatusFilter(s.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s.value
                ? "border-[--accent] bg-[--accent]/10 text-[--accent]"
                : "border-[--border] text-[--text-secondary] hover:text-[--text-primary]"
            }`}
            aria-pressed={statusFilter === s.value}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-[--destructive] bg-[--surface-raised] px-4 py-3 text-sm text-[--destructive]">
          {error}
        </div>
      ) : null}

      {filteredApps.length === 0 ? (
        <EmptyState
          title={statusFilter !== "all" ? "No applications in this status" : "No applications yet"}
          description={
            statusFilter !== "all"
              ? "Try a different status filter."
              : "Browse open roles and submit your resume to get started."
          }
          actionLabel={statusFilter === "all" ? "Browse open roles" : "Clear filter"}
          actionHref={statusFilter === "all" ? "/candidate/jobs" : undefined}
          onAction={statusFilter !== "all" ? () => setStatusFilter("all") : undefined}
        />
      ) : viewMode === "timeline" ? (
        renderTimeline()
      ) : (
        <div className="grid gap-4">
          {filteredApps.map((application) => renderApplicationCard(application))}
        </div>
      )}
    </div>
  );
}
