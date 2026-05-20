"use client";

import * as React from "react";
import Link from "next/link";
import { Badge, Button, Checkbox, Input, ScoreBadge, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/lib/applications/types";

type ApplicationItem = {
  id: string;
  status: ApplicationStatus;
  match_score: number | null;
  created_at: string | null;
  candidate: { id: string; email: string } | null;
  job: {
    id: string;
    title: string;
    department: string;
    location: string;
  } | null;
};

type RecruiterApplicationsClientProps = {
  applications: ApplicationItem[];
};

const statusOptions: ApplicationStatus[] = [
  "submitted",
  "manual_review",
  "reviewed",
  "interview_scheduled",
  "rejected",
];

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }
  return new Date(value).toLocaleDateString();
}

function formatStatus(value: ApplicationStatus) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusVariant(status: ApplicationStatus) {
  if (status === "interview_scheduled") {
    return "success" as const;
  }
  if (status === "manual_review") {
    return "warning" as const;
  }
  if (status === "rejected") {
    return "destructive" as const;
  }
  return "default" as const;
}

export default function RecruiterApplicationsClient({
  applications,
}: RecruiterApplicationsClientProps) {
  const [applicationList, setApplicationList] = React.useState(applications);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [jobFilter, setJobFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [scoreMin, setScoreMin] = React.useState("");
  const [scoreMax, setScoreMax] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [busyIds, setBusyIds] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);

  const jobs = React.useMemo(() => {
    const unique = new Map<string, string>();
    applicationList.forEach((item) => {
      if (item.job?.id) {
        unique.set(item.job.id, item.job.title);
      }
    });
    return ["all", ...Array.from(unique.entries()).map(([id, title]) => `${id}|${title}`)];
  }, [applicationList]);

  const filtered = React.useMemo(() => {
    const min = scoreMin ? Number(scoreMin) : null;
    const max = scoreMax ? Number(scoreMax) : null;

    return applicationList.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (jobFilter !== "all") {
        const [jobId] = jobFilter.split("|");
        if (item.job?.id !== jobId) {
          return false;
        }
      }
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const candidate = item.candidate?.email ?? "";
        const jobTitle = item.job?.title ?? "";
        if (!`${candidate} ${jobTitle}`.toLowerCase().includes(term)) {
          return false;
        }
      }
      if (min !== null) {
        if (item.match_score == null || item.match_score < min) {
          return false;
        }
      }
      if (max !== null) {
        if (item.match_score == null || item.match_score > max) {
          return false;
        }
      }
      if (dateFrom) {
        const created = item.created_at ? new Date(item.created_at) : null;
        if (!created || created < new Date(dateFrom)) {
          return false;
        }
      }
      if (dateTo) {
        const created = item.created_at ? new Date(item.created_at) : null;
        if (!created) {
          return false;
        }
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        if (created > endDate) {
          return false;
        }
      }
      return true;
    });
  }, [
    applicationList,
    statusFilter,
    jobFilter,
    search,
    scoreMin,
    scoreMax,
    dateFrom,
    dateTo,
  ]);

  const selectedCount = selected.size;
  const allVisibleSelected =
    filtered.length > 0 && filtered.every((item) => selected.has(item.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(filtered.map((item) => item.id)));
  }

  function toggleSelect(applicationId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(applicationId)) {
        next.delete(applicationId);
      } else {
        next.add(applicationId);
      }
      return next;
    });
  }

  function markBusy(ids: string[]) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function clearBusy(ids: string[]) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  async function updateStatus(ids: string[], status: ApplicationStatus) {
    if (!ids.length) {
      return;
    }

    setError(null);
    markBusy(ids);

    try {
      await Promise.all(
        ids.map(async (applicationId) => {
          const response = await fetch(`/api/applications/${applicationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });

          if (!response.ok) {
            throw new Error("Failed to update.");
          }
        })
      );

      setApplicationList((prev) =>
        prev.map((item) =>
          ids.includes(item.id) ? { ...item, status } : item
        )
      );
      setSelected(new Set());
    } catch {
      setError("Unable to update selected applications.");
    } finally {
      clearBusy(ids);
    }
  }

  async function inviteToInterview(applicationId: string) {
    setError(null);
    markBusy([applicationId]);

    try {
      const response = await fetch(`/api/applications/${applicationId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Invite failed.");
      }

      setApplicationList((prev) =>
        prev.map((item) =>
          item.id === applicationId
            ? { ...item, status: "interview_scheduled" }
            : item
        )
      );
    } catch {
      setError("Unable to send interview invite.");
    } finally {
      clearBusy([applicationId]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-xl border border-[--border] bg-[--surface] p-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by candidate or role"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={cn(
            "h-10 w-full rounded-lg border border-[--border] bg-[--surface-raised] px-3 text-sm text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]"
          )}
        >
          <option value="all">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {formatStatus(status)}
            </option>
          ))}
        </select>
        <select
          value={jobFilter}
          onChange={(event) => setJobFilter(event.target.value)}
          className={cn(
            "h-10 w-full rounded-lg border border-[--border] bg-[--surface-raised] px-3 text-sm text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]"
          )}
        >
          <option value="all">All jobs</option>
          {jobs.map((job) => {
            if (job === "all") {
              return null;
            }
            const [id, title] = job.split("|");
            return (
              <option key={id} value={job}>
                {title}
              </option>
            );
          })}
        </select>
        <div className="flex gap-2">
          <Input
            type="number"
            value={scoreMin}
            onChange={(event) => setScoreMin(event.target.value)}
            placeholder="Min score"
          />
          <Input
            type="number"
            value={scoreMax}
            onChange={(event) => setScoreMax(event.target.value)}
            placeholder="Max score"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-10 w-full rounded-lg border border-[--border] bg-[--surface-raised] px-3 text-xs text-[--text-secondary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-10 w-full rounded-lg border border-[--border] bg-[--surface-raised] px-3 text-xs text-[--text-secondary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]"
          />
        </div>
      </div>

      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[--border] bg-[--surface] px-4 py-3 text-sm text-[--text-secondary]">
          <span>{selectedCount} selected</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateStatus(Array.from(selected), "manual_review")}
          >
            Move to review
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateStatus(Array.from(selected), "reviewed")}
          >
            Shortlist
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateStatus(Array.from(selected), "rejected")}
          >
            Reject
          </Button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-[--destructive] bg-[--surface-raised] px-4 py-3 text-sm text-[--destructive]">
          {error}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
          No applications match the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[--text-muted]">
                <th className="px-3">
                  <Checkbox checked={allVisibleSelected} onChange={toggleSelectAll} />
                </th>
                <th className="px-3">Candidate</th>
                <th className="px-3">Applied job</th>
                <th className="px-3">Status</th>
                <th className="px-3">Match score</th>
                <th className="px-3">Applied</th>
                <th className="px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((application) => {
                const isBusy = busyIds.has(application.id);
                return (
                  <tr
                    key={application.id}
                    className="rounded-lg border border-[--border] bg-[--surface-raised]"
                  >
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={selected.has(application.id)}
                        onChange={() => toggleSelect(application.id)}
                      />
                    </td>
                    <td className="px-3 py-3 font-medium text-[--text-primary]">
                      {application.candidate?.email ?? "Candidate"}
                    </td>
                    <td className="px-3 py-3 text-[--text-secondary]">
                      {application.job?.title ?? "Role"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={getStatusVariant(application.status)}>
                        {formatStatus(application.status)}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      {application.match_score != null ? (
                        <ScoreBadge score={application.match_score} />
                      ) : (
                        <span className="text-xs text-[--text-muted]">Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[--text-secondary]">
                      {formatDate(application.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          className="text-xs text-[--accent] hover:text-[--accent-hover]"
                          href={`/recruiter/applications/${application.id}`}
                        >
                          Review
                        </Link>
                        <Link
                          className="text-xs text-[--text-secondary] hover:text-[--text-primary]"
                          href={`/recruiter/jobs/${application.job?.id ?? ""}/applications`}
                        >
                          Job apps
                        </Link>
                        <button
                          type="button"
                          onClick={() => inviteToInterview(application.id)}
                          disabled={isBusy || application.status === "interview_scheduled"}
                          className="text-xs text-[--text-secondary] hover:text-[--text-primary] disabled:opacity-50"
                        >
                          Invite
                        </button>
                        {isBusy ? <Spinner size="sm" /> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
