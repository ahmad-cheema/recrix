"use client";

import * as React from "react";
import Link from "next/link";
import { Badge, Button, Checkbox, Input, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/jobs/types";

type JobItem = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  experience_level: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[] | null;
  status: JobStatus;
  created_at: string | null;
};

type RecruiterJobsClientProps = {
  jobs: JobItem[];
  applicationCounts: Record<string, number>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }
  return new Date(value).toLocaleDateString();
}

function getStatusVariant(status: JobStatus) {
  if (status === "active") {
    return "success" as const;
  }
  if (status === "draft") {
    return "warning" as const;
  }
  return "destructive" as const;
}

function exportJobsCsv(jobs: JobItem[], counts: Record<string, number>) {
  const header = [
    "Title",
    "Department",
    "Status",
    "Applications",
    "Created",
    "Location",
    "Employment Type",
    "Experience Level",
  ];
  const rows = jobs.map((job) => [
    job.title,
    job.department,
    job.status,
    String(counts[job.id] ?? 0),
    job.created_at ?? "",
    job.location,
    job.employment_type,
    job.experience_level,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "jobs-export.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function RecruiterJobsClient({
  jobs,
  applicationCounts,
}: RecruiterJobsClientProps) {
  const [jobList, setJobList] = React.useState<JobItem[]>(jobs);
  const [counts, setCounts] = React.useState<Record<string, number>>(
    applicationCounts
  );
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [departmentFilter, setDepartmentFilter] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [busyIds, setBusyIds] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);

  const departments = React.useMemo(() => {
    const unique = new Set(jobList.map((job) => job.department));
    return ["all", ...Array.from(unique).sort()];
  }, [jobList]);

  const filteredJobs = React.useMemo(() => {
    return jobList.filter((job) => {
      if (statusFilter !== "all" && job.status !== statusFilter) {
        return false;
      }
      if (departmentFilter !== "all" && job.department !== departmentFilter) {
        return false;
      }
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const haystack = `${job.title} ${job.department}`.toLowerCase();
        if (!haystack.includes(term)) {
          return false;
        }
      }
      if (dateFrom) {
        const created = job.created_at ? new Date(job.created_at) : null;
        if (!created || created < new Date(dateFrom)) {
          return false;
        }
      }
      if (dateTo) {
        const created = job.created_at ? new Date(job.created_at) : null;
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
  }, [jobList, statusFilter, departmentFilter, search, dateFrom, dateTo]);

  const selectedCount = selected.size;
  const allVisibleSelected =
    filteredJobs.length > 0 &&
    filteredJobs.every((job) => selected.has(job.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(filteredJobs.map((job) => job.id)));
  }

  function toggleSelect(jobId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  }

  function markBusy(ids: string[]) {
    setBusyIds((prev) => new Set([...Array.from(prev), ...ids]));
  }

  function clearBusy(ids: string[]) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  async function updateStatus(ids: string[], nextStatus: JobStatus) {
    if (!ids.length) {
      return;
    }

    setError(null);
    markBusy(ids);

    try {
      await Promise.all(
        ids.map(async (jobId) => {
          const response = await fetch(`/api/jobs/${jobId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
          });

          if (!response.ok) {
            throw new Error("Failed to update status.");
          }
        })
      );

      setJobList((prev) =>
        prev.map((job) =>
          ids.includes(job.id) ? { ...job, status: nextStatus } : job
        )
      );
      setSelected(new Set());
    } catch {
      setError("Unable to update selected jobs.");
    } finally {
      clearBusy(ids);
    }
  }

  async function duplicateJob(job: JobItem) {
    setError(null);
    markBusy([job.id]);

    try {
      const payload = {
        title: `${job.title} (Copy)`,
        department: job.department,
        location: job.location,
        employmentType: job.employment_type,
        experienceLevel: job.experience_level,
        description: job.description,
        requiredSkills: job.required_skills,
        preferredSkills: job.preferred_skills ?? [],
        status: "draft",
      };

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | { job?: JobItem; error?: string }
        | null;

      if (!response.ok || !result?.job) {
        throw new Error(result?.error ?? "Failed to duplicate job.");
      }

      setJobList((prev) => [result.job as JobItem, ...prev]);
      setCounts((prev) => ({ ...prev, [result.job?.id ?? ""]: 0 }));
    } catch {
      setError("Unable to duplicate job.");
    } finally {
      clearBusy([job.id]);
    }
  }

  async function deleteJob(jobId: string) {
    const confirmed = window.confirm(
      "Delete this job? This will remove all related applications."
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    markBusy([jobId]);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job.");
      }

      setJobList((prev) => prev.filter((job) => job.id !== jobId));
      setCounts((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
    } catch {
      setError("Unable to delete job.");
    } finally {
      clearBusy([jobId]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-xl border border-[--border] bg-[--surface] p-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title or department"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={cn(
            "h-10 w-full rounded-lg border border-[--border] bg-[--surface-raised] px-3 text-sm text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]"
          )}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={departmentFilter}
          onChange={(event) => setDepartmentFilter(event.target.value)}
          className={cn(
            "h-10 w-full rounded-lg border border-[--border] bg-[--surface-raised] px-3 text-sm text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]"
          )}
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept === "all" ? "All departments" : dept}
            </option>
          ))}
        </select>
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
            onClick={() => updateStatus(Array.from(selected), "active")}
          >
            Activate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateStatus(Array.from(selected), "closed")}
          >
            Archive
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => exportJobsCsv(filteredJobs, counts)}
          >
            Export
          </Button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-[--destructive] bg-[--surface-raised] px-4 py-3 text-sm text-[--destructive]">
          {error}
        </div>
      ) : null}

      {filteredJobs.length === 0 ? (
        <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
          No jobs match the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[--text-muted]">
                <th className="px-3">
                  <Checkbox
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-3">Title</th>
                <th className="px-3">Department</th>
                <th className="px-3">Applications</th>
                <th className="px-3">Status</th>
                <th className="px-3">Created</th>
                <th className="px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
                const isBusy = busyIds.has(job.id);

                return (
                  <tr
                    key={job.id}
                    className="rounded-lg border border-[--border] bg-[--surface-raised]"
                  >
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={selected.has(job.id)}
                        onChange={() => toggleSelect(job.id)}
                      />
                    </td>
                    <td className="px-3 py-3 font-medium text-[--text-primary]">
                      {job.title}
                    </td>
                    <td className="px-3 py-3 text-[--text-secondary]">
                      {job.department}
                    </td>
                    <td className="px-3 py-3 text-[--text-secondary]">
                      {counts[job.id] ?? 0}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={getStatusVariant(job.status)}>
                        {job.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-[--text-secondary]">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          className="text-xs text-[--accent] hover:text-[--accent-hover]"
                          href={`/recruiter/jobs/${job.id}`}
                        >
                          Edit
                        </Link>
                        <Link
                          className="text-xs text-[--text-secondary] hover:text-[--text-primary]"
                          href={`/recruiter/jobs/${job.id}/applications`}
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => duplicateJob(job)}
                          disabled={isBusy}
                          className="text-xs text-[--text-secondary] hover:text-[--text-primary] disabled:opacity-50"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus([job.id], "closed")}
                          disabled={isBusy}
                          className="text-xs text-[--text-secondary] hover:text-[--text-primary] disabled:opacity-50"
                        >
                          Archive
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteJob(job.id)}
                          disabled={isBusy}
                          className="text-xs text-[--destructive] hover:text-[--destructive] disabled:opacity-50"
                        >
                          Delete
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
