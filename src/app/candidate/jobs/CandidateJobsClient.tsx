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

type UploadState = "idle" | "uploading" | "success" | "error";
type Application = {
  id: string;
  job_id: string;
  status: string;
  match_score: number | null;
  risk_evaluation: string | null;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CandidateJobsClient({
  jobs,
  applications,
}: {
  jobs: Job[];
  applications: Application[];
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

  const resetUpload = React.useCallback(() => {
    setFile(null);
    setError(null);
    setProgress(0);
    setUploadState("idle");
  }, []);

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

  function formatStatus(value: string) {
    return value
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
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
        setProgress(Math.round((event.loaded / event.total) * 100));
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
        setUploadState("success");
        setProgress(100);
        router.refresh();
        setTimeout(() => closeModal(), 400);
        return;
      }

      setUploadState("error");
      setError(response?.error ?? "Upload failed.");
    };

    request.onerror = () => {
      setUploadState("error");
      setError("Upload failed.");
    };

    request.send(formData);
  }

  return (
    <div className="min-h-screen bg-[--background] px-6 py-10 text-[--text-primary]">
      <motion.div
        className="mx-auto flex w-full max-w-6xl flex-col gap-8"
        {...entryMotion}
      >
        <div>
          <h1 className="text-2xl font-semibold">Open roles</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            Browse active listings and submit your resume in minutes.
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-[--border] bg-[--surface] p-8 text-sm text-[--text-secondary]">
            No active roles yet. Check back soon.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => {
              const application = applicationsByJobId.get(job.id);

              return (
              <Card
                key={job.id}
                className="transition-transform duration-150 hover:scale-[1.005]"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{job.title}</CardTitle>
                      <CardDescription>
                        {job.department} · {job.location}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{job.experience_level}</Badge>
                      {application ? (
                        <Badge>{formatStatus(application.status)}</Badge>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[--text-secondary]">
                    {job.description}
                  </p>
                  {application?.risk_evaluation ? (
                    <p className="mt-3 text-xs text-[--text-muted]">
                      {application.risk_evaluation}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.required_skills.slice(0, 4).map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-[--text-muted]">
                      {job.employment_type}
                    </span>
                    <div className="flex items-center gap-2">
                      {application?.match_score != null ? (
                        <ScoreBadge score={application.match_score} />
                      ) : null}
                      <Button
                        size="sm"
                        onClick={() => openModal(job)}
                        disabled={Boolean(application)}
                      >
                        {application ? "Applied" : "Apply"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
              {RESUME_ALLOWED_EXTENSIONS.join(", ")} · Max {formatFileSize(
                MAX_RESUME_FILE_SIZE
              )}
            </p>
          </div>

          {file ? (
            <div className="rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span>{file.name}</span>
                <span className="text-xs text-[--text-muted]">
                  {formatFileSize(file.size)}
                </span>
              </div>
            </div>
          ) : null}

          {uploadState !== "idle" ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-xs text-[--text-muted]">
                <span>Uploading</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar value={progress} />
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
              disabled={uploadState === "uploading"}
            >
              {uploadState === "uploading" ? (
                <Spinner size="sm" />
              ) : (
                "Submit application"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
