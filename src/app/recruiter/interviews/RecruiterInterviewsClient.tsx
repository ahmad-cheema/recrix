"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@/components/ui";

type InterviewItem = {
  id: string;
  applicationId: string;
  jobTitle: string;
  candidateEmail: string;
  status: string;
  scheduledAt: string | null;
};

type PendingInvite = {
  applicationId: string;
  jobTitle: string;
  candidateEmail: string;
  invitedAt: string | null;
};

type RecruiterInterviewsClientProps = {
  sessions: InterviewItem[];
  invites: PendingInvite[];
};

type ViewMode = "list" | "calendar";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled yet";
  }
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusVariant(status: string) {
  if (status === "completed") {
    return "success" as const;
  }
  if (status === "in_progress") {
    return "warning" as const;
  }
  return "default" as const;
}

function getWeekDays(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWithin7Days(dateStr: string | null): boolean {
  if (!dateStr) {
    return false;
  }
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

export default function RecruiterInterviewsClient({
  sessions,
  invites,
}: RecruiterInterviewsClientProps) {
  const [view, setView] = React.useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const filtered = React.useMemo(() => {
    if (statusFilter === "all") {
      return sessions;
    }
    return sessions.filter((s) => s.status === statusFilter);
  }, [sessions, statusFilter]);

  const weekDays = React.useMemo(() => getWeekDays(), []);
  const today = new Date();

  function renderCalendar() {
    return (
      <div className="grid gap-3 lg:grid-cols-7">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          const daySessions = filtered.filter(
            (s) =>
              s.scheduledAt && isSameDay(new Date(s.scheduledAt), day)
          );

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[140px] rounded-xl border p-3 ${
                isToday
                  ? "border-[--accent]/40 bg-[--surface]"
                  : "border-[--border] bg-[--surface]"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    isToday ? "text-[--accent]" : "text-[--text-muted]"
                  }`}
                >
                  {DAY_NAMES[weekDays.indexOf(day)]}
                </span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-[--accent] text-[--background] font-bold"
                      : "text-[--text-secondary]"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {daySessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/recruiter/applications/${session.applicationId}`}
                    className={`rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-[--surface-raised] ${
                      isWithin7Days(session.scheduledAt)
                        ? "border border-[--accent]/30 bg-[--accent]/5"
                        : "border border-[--border] bg-[--surface-raised]"
                    }`}
                  >
                    <p className="font-medium text-[--text-primary] truncate">
                      {session.candidateEmail.split("@")[0]}
                    </p>
                    <p className="text-[--text-muted] truncate">
                      {session.jobTitle}
                    </p>
                  </Link>
                ))}
                {daySessions.length === 0 ? (
                  <p className="text-[10px] text-[--text-muted]">No interviews</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-[--text-muted]">
            View
          </span>
          <Button
            size="sm"
            variant={view === "list" ? "primary" : "ghost"}
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            List
          </Button>
          <Button
            size="sm"
            variant={view === "calendar" ? "primary" : "ghost"}
            onClick={() => setView("calendar")}
            aria-pressed={view === "calendar"}
          >
            Calendar
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-[--border] bg-[--surface-raised] px-3 text-xs text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <Badge>{filtered.length} sessions</Badge>
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Invites awaiting confirmation</CardTitle>
            <CardDescription>Interview links sent to candidates.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {invites.map((invite) => (
              <div
                key={invite.applicationId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3 text-sm"
              >
                <div>
                  <p className="text-sm font-medium text-[--text-primary]">
                    {invite.candidateEmail}
                  </p>
                  <p className="text-xs text-[--text-secondary]">
                    {invite.jobTitle}
                  </p>
                </div>
                <div className="text-xs text-[--text-muted]">
                  Invite sent {formatDate(invite.invitedAt)}
                </div>
                <Link
                  className="text-xs text-[--accent] hover:text-[--accent-hover]"
                  href={`/recruiter/applications/${invite.applicationId}`}
                >
                  View
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Main content */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No interview sessions"
          description="Invite candidates to interview and their sessions will appear here."
        />
      ) : view === "list" ? (
        <div className="grid gap-3">
          {filtered.map((session) => {
            const upcoming = isWithin7Days(session.scheduledAt);

            return (
              <Card
                key={session.id}
                className={upcoming ? "border-[--accent]/30" : ""}
              >
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle>{session.candidateEmail}</CardTitle>
                      <CardDescription>{session.jobTitle}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {upcoming ? (
                        <Badge variant="success">Upcoming</Badge>
                      ) : null}
                      <Badge variant={getStatusVariant(session.status)}>
                        {formatStatus(session.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="text-[--text-secondary]">
                    Scheduled {formatDate(session.scheduledAt)}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      className="text-xs text-[--accent] hover:text-[--accent-hover]"
                      href={`/recruiter/applications/${session.applicationId}`}
                    >
                      View details
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        renderCalendar()
      )}
    </div>
  );
}
