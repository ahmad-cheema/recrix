import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/auth/errors";
import type { CreateJobInput, UpdateJobInput } from "./validators";
import type { Database } from "@/lib/supabase/database";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
type JobUpdate = Database["public"]["Tables"]["jobs"]["Update"];

type SkillList = string[] | undefined;

function normalizeSkills(skills: SkillList): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const skill of skills ?? []) {
    const trimmed = skill.trim();
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export async function createJob(
  input: CreateJobInput,
  recruiterId: string
): Promise<JobRow> {
  try {
    const client = createAdminClient();
    const requiredSkills = normalizeSkills(input.requiredSkills);
    const preferredSkills = normalizeSkills(input.preferredSkills);

    if (!requiredSkills.length) {
      throw new AppError(
        "VALIDATION_ERROR",
        "At least one required skill is needed.",
        400
      );
    }

    const { data, error } = await client
      .from("jobs")
      .insert({
        recruiter_id: recruiterId,
        title: input.title.trim(),
        department: input.department.trim(),
        location: input.location.trim(),
        employment_type: input.employmentType.trim(),
        required_skills: requiredSkills,
        preferred_skills: preferredSkills.length ? preferredSkills : null,
        experience_level: input.experienceLevel.trim(),
        description: input.description.trim(),
        status: input.status ?? "active",
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError("INTERNAL_ERROR", "Job creation failed.", 500);
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "Job creation failed.", 500);
  }
}

export async function listRecruiterJobs(
  recruiterId: string
): Promise<JobRow[]> {
  try {
    const client = createAdminClient();
    const { data, error } = await client
      .from("jobs")
      .select("*")
      .eq("recruiter_id", recruiterId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      throw new AppError("INTERNAL_ERROR", "Failed to load jobs.", 500);
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "Failed to load jobs.", 500);
  }
}

export async function listActiveJobs(): Promise<JobRow[]> {
  try {
    const client = createAdminClient();
    const { data, error } = await client
      .from("jobs")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error || !data) {
      throw new AppError("INTERNAL_ERROR", "Failed to load jobs.", 500);
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "Failed to load jobs.", 500);
  }
}

export async function getJobById(jobId: string): Promise<JobRow> {
  try {
    const client = createAdminClient();
    const { data, error } = await client
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to load job.", 500);
    }

    if (!data) {
      throw new AppError("NOT_FOUND", "Job not found.", 404);
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "Failed to load job.", 500);
  }
}

export async function updateJob(
  jobId: string,
  recruiterId: string,
  input: UpdateJobInput
): Promise<JobRow> {
  try {
    const client = createAdminClient();
    const update: JobUpdate = {};

    if (input.title !== undefined) {
      update.title = input.title.trim();
    }
    if (input.department !== undefined) {
      update.department = input.department.trim();
    }
    if (input.location !== undefined) {
      update.location = input.location.trim();
    }
    if (input.employmentType !== undefined) {
      update.employment_type = input.employmentType.trim();
    }
    if (input.requiredSkills !== undefined) {
      const requiredSkills = normalizeSkills(input.requiredSkills);
      if (!requiredSkills.length) {
        throw new AppError(
          "VALIDATION_ERROR",
          "At least one required skill is needed.",
          400
        );
      }
      update.required_skills = requiredSkills;
    }
    if (input.preferredSkills !== undefined) {
      const preferredSkills = normalizeSkills(input.preferredSkills);
      update.preferred_skills = preferredSkills.length ? preferredSkills : null;
    }
    if (input.experienceLevel !== undefined) {
      update.experience_level = input.experienceLevel.trim();
    }
    if (input.description !== undefined) {
      update.description = input.description.trim();
    }
    if (input.status !== undefined) {
      update.status = input.status;
    }

    if (!Object.keys(update).length) {
      throw new AppError("VALIDATION_ERROR", "No changes provided.", 400);
    }

    const { data, error } = await client
      .from("jobs")
      .update(update)
      .eq("id", jobId)
      .eq("recruiter_id", recruiterId)
      .select("*")
      .single();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Job update failed.", 500);
    }

    if (!data) {
      throw new AppError("NOT_FOUND", "Job not found.", 404);
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "Job update failed.", 500);
  }
}
