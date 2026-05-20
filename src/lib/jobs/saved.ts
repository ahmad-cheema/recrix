import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/auth/errors";

export async function listSavedJobs(candidateId: string): Promise<string[]> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("saved_jobs")
    .select("job_id")
    .eq("candidate_id", candidateId);

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Failed to load saved jobs.", 500);
  }

  return (data ?? []).map((row) => row.job_id);
}

export async function saveJob(
  candidateId: string,
  jobId: string
): Promise<void> {
  const client = createAdminClient();
  const { error } = await client
    .from("saved_jobs")
    .insert({ candidate_id: candidateId, job_id: jobId });

  if (error && error.code !== "23505") {
    throw new AppError("INTERNAL_ERROR", "Failed to save job.", 500);
  }
}

export async function unsaveJob(
  candidateId: string,
  jobId: string
): Promise<void> {
  const client = createAdminClient();
  const { error } = await client
    .from("saved_jobs")
    .delete()
    .eq("candidate_id", candidateId)
    .eq("job_id", jobId);

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Failed to unsave job.", 500);
  }
}
