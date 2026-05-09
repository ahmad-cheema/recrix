import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/auth/errors";
import { withRetry } from "@/lib/utils";
import { extractResumeText } from "@/lib/resume/extract";
import { validateResumeFile } from "@/lib/resume/validation";
import type { Database } from "@/lib/supabase/database";
import type { ApplicationStatus } from "./types";

type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];

type ResumePayload = {
  jobId: string;
  candidateId: string;
  file: File;
};

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function buildResumePath({ file, jobId, candidateId }: ResumePayload): string {
  const safeName = sanitizeFileName(file.name);
  const id = crypto.randomUUID();
  return `${candidateId}/${jobId}/${id}-${safeName}`;
}

export async function createApplicationWithResume({
  jobId,
  candidateId,
  file,
}: ResumePayload): Promise<ApplicationRow> {
  const validation = validateResumeFile(file);

  if (!validation.ok) {
    throw new AppError("VALIDATION_ERROR", validation.error, 400);
  }

  const client = createAdminClient();
  const { data: job, error: jobError } = await client
    .from("jobs")
    .select("id, status")
    .eq("id", jobId)
    .maybeSingle();

  if (jobError) {
    throw new AppError("INTERNAL_ERROR", "Failed to load job.", 500);
  }

  if (!job || job.status !== "active") {
    throw new AppError("NOT_FOUND", "Job not found.", 404);
  }

  const storagePath = buildResumePath({ file, jobId, candidateId });
  const { error: uploadError } = await client.storage
    .from("resumes")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new AppError("INTERNAL_ERROR", "Resume upload failed.", 500);
  }

  let status: ApplicationStatus = "submitted";
  let parsedResume: Database["public"]["Tables"]["applications"]["Row"]["parsed_resume"] =
    null;

  try {
    const text = await withRetry(() => extractResumeText(file), 2);
    parsedResume = {
      raw_text: text,
      extracted_at: new Date().toISOString(),
    };
  } catch {
    status = "manual_review";
  }

  const { data, error } = await client
    .from("applications")
    .insert({
      job_id: jobId,
      candidate_id: candidateId,
      resume_path: storagePath,
      parsed_resume: parsedResume,
      status,
    })
    .select("*")
    .single();

  if (error) {
    await client.storage.from("resumes").remove([storagePath]);

    if (error.code === "23505") {
      throw new AppError("CONFLICT", "Already applied to this job.", 409);
    }

    throw new AppError("INTERNAL_ERROR", "Application creation failed.", 500);
  }

  if (!data) {
    throw new AppError("INTERNAL_ERROR", "Application creation failed.", 500);
  }

  return data;
}
