"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  ProgressBar,
  ScoreBadge,
  Spinner,
} from "@/components/ui";
import {
  MAX_RESUME_FILE_SIZE,
  RESUME_ALLOWED_EXTENSIONS,
} from "@/lib/resume/constants";
import { validateResumeFile } from "@/lib/resume/validation";

const entryMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

const acceptedTypes = RESUME_ALLOWED_EXTENSIONS.join(",");

type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  experience_level: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[] | null;
};

type UploadState =
  | "idle"
  | "uploading"
  | "uploaded"
  | "parsing"
  | "ai_analyzing"
  | "completed"
  | "failed";
type Application = {
  id: string;
  job_id: string;
  status: string;
  match_score: number | null;
  risk_evaluation: string | null;
};

type ViewMode = "grid" | "list";

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconList({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function IconBookmark({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

export default function CandidateJobsClient({
  jobs,
  applications,
  savedJobIds: initialSavedIds,
}: {
  jobs: Job[];
  applications: Application[];
  savedJobIds: string[];
}) {
  const router = useRouter();
  const applicationsByJobId = React.useMemo(() => {
    return new Map(applications.map((application) => [application.job_id, application]));
  }, [applications]);

  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [uploadState, setUploadState] = React.useState<UploadState>("idle");
  const [dragActive, setDragActive] = React.useState(false);

  // Filters
  const [search, setSearch] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("all");
  const [locationFilter, setLocationFilter] = React.useState("all");
  const [experienceFilter, setExperienceFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [savedJobIds, setSavedJobIds] = React.useState<Set<string>>(new Set(initialSavedIds));
  const [showSavedOnly, setShowSavedOnly] = React.useState(false);

  const departments = React.useMemo(() => {
    const unique = new Set(jobs.map((j) => j.department));
    return ["all", ...Array.from(unique).sort()];
  }, [jobs]);

  const locations = React.useMemo(() => {
    const unique = new Set(jobs.map((j) => j.location));
    return ["all", ...Array.from(unique).sort()];
  }, [jobs]);

  const experienceLevels = React.useMemo(() => {
    const unique = new Set(jobs.map((j) => j.experience_level));
    return ["all", ...Array.from(unique).sort()];
  }, [jobs]);

  const employmentTypes = React.useMemo(() => {
    const unique = new Set(jobs.map((j) => j.employment_type));
    return ["all", ...Array.from(unique).sort()];
  }, [jobs]);

  const filteredJobs = React.useMemo(() => {
    return jobs.filter((job) => {
      if (showSavedOnly && !savedJobIds.has(job.id)) {
        return false;
      }
      if (departmentFilter !== "all" && job.department !== departmentFilter) {
        return false;
      }
      if (locationFilter !== "all" && job.location !== locationFilter) {
        return false;
      }
      if (experienceFilter !== "all" && job.experience_level !== experienceFilter) {
        return false;
      }
      if (typeFilter !== "all" && job.employment_type !== typeFilter) {
        return false;
      }
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const requiredSkills = ensureStringArray(job.required_skills);
        const haystack = `${job.title} ${job.department} ${job.location} ${requiredSkills.join(" ")}`.toLowerCase();
        if (!haystack.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [jobs, search, departmentFilter, locationFilter, experienceFilter, typeFilter, showSavedOnly, savedJobIds]);

  const selectClass =
    "h-10 w-full rounded-lg border border-[--border] bg-[--surface-raised] px-3 text-sm text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";

  const resetUpload = React.useCallback(() => {
    setFile(null);
    setError(null);
    setProgress(0);
    setUploadState("idle");
  }, []);

  React.useEffect(() => {
    if (uploadState !== "uploaded") {
      return;
    }
    const parsingTimer = setTimeout(() => setUploadState("parsing"), 500);
    const aiTimer = setTimeout(() => setUploadState("ai_analyzing"), 1800);
    return () => {
      clearTimeout(parsingTimer);
      clearTimeout(aiTimer);
    };
  }, [uploadState]);

  function openModal(job: Job) {
    if (applicationsByJobId.has(job.id)) {
      return;
    }
    setSelectedJob(job);
    resetUpload();
  }

  function closeModal() {
    setSelectedJob(null);
    resetUpload();
  }

  function handleFileSelect(nextFile: File | null) {
    if (!nextFile) {
      return;
    }
    const validation = validateResumeFile(nextFile);
    if (!validation.ok) {
      setError(validation.error);
      setFile(null);
      return;
    }
    setError(null);
    setFile(nextFile);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0];
    handleFileSelect(dropped ?? null);
  }

  async function toggleSave(jobId: string) {
    const isSaved = savedJobIds.has(jobId);
    const next = new Set(savedJobIds);
    if (isSaved) {
      next.delete(jobId);
      setSavedJobIds(next);
      await fetch(`/api/jobs/saved?jobId=${jobId}`, { method: "DELETE" }).catch(() => {});
    } else {
      next.add(jobId);
      setSavedJobIds(next);
      await fetch("/api/jobs/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      }).catch(() => {});
    }
  }

  async function submitApplication() {
    if (!selectedJob || !file) {
      setError("Select a resume before submitting.");
      return;
    }
    setUploadState("uploading");
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("jobId", selectedJob.id);
    formData.append("file", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/applications");

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const nextProgress = Math.round((event.loaded / event.total) * 100);
        setProgress(nextProgress);
        if (nextProgress >= 100) {
          setUploadState((prev) =>
            prev === "uploading" ? "uploaded" : prev
          );
        }
      }
    };

    request.onload = () => {
      let response: { error?: string } | null = null;
      try {
        response = JSON.parse(request.responseText || "null") as
          | { error?: string }
          | null;
      } catch {
        response = null;
      }

      if (request.status >= 200 && request.status < 300) {
        setUploadState("completed");
        setProgress(100);
        router.refresh();
        setTimeout(() => closeModal(), 400);
        return;
      }

      setUploadState("failed");
      setError(response?.error ?? "Upload failed.");
    };

    request.onerror = () => {
      setUploadState("failed");
      setError("Upload failed.");
    };

    request.send(formData);
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div className="flex flex-col gap-6" {...entryMotion}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Open roles</h1>
            <p className="mt-2 text-sm text-[--text-secondary]">
              Browse active listings and submit your resume in minutes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                showSavedOnly
                  ? "border-[--accent] text-[--accent]"
                  : "border-[--border] text-[--text-secondary] hover:text-[--text-primary]"
              }`}
              aria-label={showSavedOnly ? "Show all jobs" : "Show saved jobs only"}
              aria-pressed={showSavedOnly}
            >
              <IconBookmark className="h-4 w-4" filled={showSavedOnly} />
              Saved
            </button>
            <div className="flex rounded-lg border border-[--border]">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex h-9 w-9 items-center justify-center rounded-l-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-[--surface-raised] text-[--text-primary]"
                    : "text-[--text-muted] hover:text-[--text-primary]"
                }`}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <IconGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex h-9 w-9 items-center justify-center rounded-r-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-[--surface-raised] text-[--text-primary]"
                    : "text-[--text-muted] hover:text-[--text-primary]"
                }`}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <IconList className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid gap-3 rounded-xl border border-[--border] bg-[--surface] p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, skills, or department"
            aria-label="Search jobs"
          />
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className={selectClass} aria-label="Filter by department">
            {departments.map((d) => (
              <option key={d} value={d}>{d === "all" ? "All departments" : d}</option>
            ))}
          </select>
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className={selectClass} aria-label="Filter by location">
            {locations.map((l) => (
              <option key={l} value={l}>{l === "all" ? "All locations" : l}</option>
            ))}
          </select>
          <select value={experienceFilter} onChange={(e) => setExperienceFilter(e.target.value)} className={selectClass} aria-label="Filter by experience">
            {experienceLevels.map((e) => (
              <option key={e} value={e}>{e === "all" ? "All levels" : e}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass} aria-label="Filter by employment type">
            {employmentTypes.map((t) => (
              <option key={t} value={t}>{t === "all" ? "All types" : t}</option>
            ))}
          </select>
        </div>

        {filteredJobs.length === 0 ? (
          <EmptyState
            title={showSavedOnly ? "No saved roles" : "No matching roles"}
            description={
              showSavedOnly
                ? "Save roles from the job board to see them here."
                : "Try adjusting your filters or check back later."
            }
            actionLabel={showSavedOnly ? "View all roles" : undefined}
            onAction={showSavedOnly ? () => setShowSavedOnly(false) : undefined}
          />
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredJobs.map((job) => {
              const application = applicationsByJobId.get(job.id);
              const isSaved = savedJobIds.has(job.id);
              const requiredSkills = ensureStringArray(job.required_skills);

              return (
                <Card key={job.id} className="transition-transform duration-150 hover:scale-[1.005]">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{job.title}</CardTitle>
                        <CardDescription>{job.department} · {job.location}</CardDescription>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleSave(job.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[--text-muted] transition-colors hover:text-[--accent]"
                          aria-label={isSaved ? "Remove from saved" : "Save for later"}
                        >
                          <IconBookmark className="h-4 w-4" filled={isSaved} />
                        </button>
                        <Badge>{job.experience_level}</Badge>
                        {application ? (
                          <Badge>{formatStatus(application.status)}</Badge>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-[--text-secondary]">{job.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {requiredSkills.slice(0, 4).map((skill) => (
                        <Badge key={skill}>{skill}</Badge>
                      ))}
                      {requiredSkills.length > 4 ? (
                        <Badge>+{requiredSkills.length - 4}</Badge>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-[--text-muted]">{job.employment_type}</span>
                      <div className="flex items-center gap-2">
                        {application?.match_score != null ? (
                          <ScoreBadge score={application.match_score} />
                        ) : null}
                        <Button size="sm" onClick={() => openModal(job)} disabled={Boolean(application)}>
                          {application ? "Applied" : "Apply"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredJobs.map((job) => {
              const application = applicationsByJobId.get(job.id);
              const isSaved = savedJobIds.has(job.id);
              const requiredSkills = ensureStringArray(job.required_skills);

              return (
                <div
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[--border] bg-[--surface] px-5 py-4 transition-shadow duration-200 hover:shadow-[0_12px_32px_-24px_rgba(4,8,15,0.9)]"
                >
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => toggleSave(job.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[--text-muted] transition-colors hover:text-[--accent]"
                      aria-label={isSaved ? "Remove from saved" : "Save for later"}
                    >
                      <IconBookmark className="h-4 w-4" filled={isSaved} />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-[--text-primary]">{job.title}</p>
                      <p className="text-xs text-[--text-secondary]">
                        {job.department} · {job.location} · {job.employment_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {requiredSkills.slice(0, 3).map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                    <Badge>{job.experience_level}</Badge>
                    {application ? (
                      <>
                        {application.match_score != null ? (
                          <ScoreBadge score={application.match_score} />
                        ) : null}
                        <Badge>{formatStatus(application.status)}</Badge>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => openModal(job)}>
                        Apply
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <Modal
        open={Boolean(selectedJob)}
        onClose={closeModal}
        title={selectedJob ? `Apply for ${selectedJob.title}` : undefined}
        description={
          selectedJob
            ? `${selectedJob.department} · ${selectedJob.location}`
            : undefined
        }
      >
        <div className="flex flex-col gap-4">
          <div
            className={`rounded-lg border border-dashed px-4 py-6 text-center text-sm transition-colors ${
              dragActive
                ? "border-[--text-primary] text-[--text-primary]"
                : "border-[--border] text-[--text-secondary]"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <input
              id="resume"
              type="file"
              accept={acceptedTypes}
              className="hidden"
              onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
            />
            <label htmlFor="resume" className="cursor-pointer">
              Drag and drop your resume, or click to upload.
            </label>
            <p className="mt-2 text-xs text-[--text-muted]">
              {RESUME_ALLOWED_EXTENSIONS.join(", ")} · Max {formatFileSize(MAX_RESUME_FILE_SIZE)}
            </p>
          </div>

          {file ? (
            <div className="rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span>{file.name}</span>
                <span className="text-xs text-[--text-muted]">{formatFileSize(file.size)}</span>
              </div>
            </div>
          ) : null}

          {uploadState !== "idle" ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-xs text-[--text-muted]">
                <span>
                  {uploadState === "uploading" && "Uploading"}
                  {uploadState === "uploaded" && "Uploaded"}
                  {uploadState === "parsing" && "Parsing"}
                  {uploadState === "ai_analyzing" && "AI Analyzing"}
                  {uploadState === "completed" && "Completed"}
                  {uploadState === "failed" && "Failed"}
                </span>
                <span>{uploadState === "uploading" ? `${progress}%` : ""}</span>
              </div>
              <ProgressBar
                value={
                  uploadState === "uploading"
                    ? progress
                    : uploadState === "uploaded"
                    ? 100
                    : uploadState === "parsing"
                    ? 100
                    : uploadState === "ai_analyzing"
                    ? 100
                    : uploadState === "completed"
                    ? 100
                    : 0
                }
              />
              {uploadState === "parsing" ? (
                <p className="text-xs text-[--text-muted]">
                  Extracting resume data...
                </p>
              ) : null}
              {uploadState === "ai_analyzing" ? (
                <p className="text-xs text-[--text-muted]">
                  Application submitted. AI evaluation can be run by recruiter during review.
                </p>
              ) : null}
            </div>
          ) : null}

          <AnimatePresence>
            {error ? (
              <motion.p
                className="text-sm text-[--destructive]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
              >
                {error}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={submitApplication}
              disabled={
                uploadState === "uploading" ||
                uploadState === "uploaded" ||
                uploadState === "parsing" ||
                uploadState === "ai_analyzing"
              }
            >
              {uploadState === "uploading" ? <Spinner size="sm" /> : "Submit application"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
