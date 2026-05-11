"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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

  return (
    <div className="min-h-screen bg-[--background] px-6 py-10 text-[--text-primary]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Your applications</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            Track match scores and start your mock interviews.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-[--destructive] bg-[--surface-raised] px-4 py-3 text-sm text-[--destructive]">
            {error}
          </div>
        ) : null}

        {applications.length === 0 ? (
          <div className="rounded-xl border border-[--border] bg-[--surface] p-8 text-sm text-[--text-secondary]">
            No applications yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <CardTitle>{application.job?.title ?? "Role"}</CardTitle>
                      <CardDescription>
                        {application.job?.department} · {application.job?.location}
                      </CardDescription>
                    </div>
                    <Badge>{formatStatus(application.status)}</Badge>
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
                    <Button
                      size="sm"
                      onClick={() => startInterview(application.id)}
                      disabled={
                        (!sessions[application.id] &&
                          application.status !== "interview_scheduled") ||
                        loadingId === application.id
                      }
                    >
                      {loadingId === application.id ? (
                        <Spinner size="sm" />
                      ) : (
                        getActionLabel(application)
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
