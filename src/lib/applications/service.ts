import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/auth/errors";
import { withRetry } from "@/lib/utils";
import { parseResumeText, scoreApplication, type ParsedResume } from "@/lib/ai/resume";
import { sendInterviewInviteEmail } from "@/lib/email/resend";
import { extractResumeText } from "@/lib/resume/extract";
import { validateResumeFile } from "@/lib/resume/validation";
import type { Database } from "@/lib/supabase/database";
import type { ApplicationStatus } from "./types";

type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];

type RecruiterApplicationListItem = {
  id: string;
  status: ApplicationStatus;
  match_score: number | null;
  risk_evaluation: string | null;
  created_at: string | null;
  candidate: { id: string; email: string } | null;
};

type CandidateApplicationListItem = {
  id: string;
  job_id: string;
  status: ApplicationStatus;
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

type RecruiterApplicationStats = {
  total: number;
  pendingReview: number;
  scheduled: number;
  byJobId: Record<string, number>;
};

type ApplicationDetailRow = ApplicationRow & {
  candidate: { id: string; email: string } | null;
  job: {
    id: string;
    recruiter_id: string;
    title: string;
    department: string;
    location: string;
    employment_type: string;
    experience_level: string;
    description: string;
  } | null;
};

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
    .select(
      "id, status, title, department, location, employment_type, required_skills, preferred_skills, experience_level, description"
    )
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
  let matchScore: number | null = null;
  let riskEvaluation: string | null = null;
  let extractedText: string | null = null;

  try {
    const text = await withRetry(() => extractResumeText(file), 2);
    extractedText = text;
    const parsed = await withRetry(() => parseResumeText(text), 2);
    parsedResume = {
      raw_text: text,
      parsed,
      extracted_at: new Date().toISOString(),
      parsed_at: new Date().toISOString(),
    };

    try {
      const scoring = await withRetry(
        () =>
          scoreApplication(parsed, {
            title: job.title,
            department: job.department,
            location: job.location,
            employmentType: job.employment_type,
            requiredSkills: job.required_skills,
            preferredSkills: job.preferred_skills,
            experienceLevel: job.experience_level,
            description: job.description,
          }),
        2
      );
      matchScore = scoring.score;
      riskEvaluation = scoring.riskEvaluation;
    } catch {
      matchScore = null;
      riskEvaluation = "Score unavailable.";
    }
  } catch {
    status = "manual_review";
  }

  if (!parsedResume && extractedText) {
    parsedResume = {
      raw_text: extractedText,
      extracted_at: new Date().toISOString(),
    };
  }

  const { data, error } = await client
    .from("applications")
    .insert({
      job_id: jobId,
      candidate_id: candidateId,
      resume_path: storagePath,
      parsed_resume: parsedResume,
      match_score: matchScore,
      risk_evaluation: riskEvaluation,
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

export async function listApplicationsForJob(
  jobId: string,
  recruiterId: string
): Promise<{ job: { id: string; title: string }; applications: RecruiterApplicationListItem[] }> {
  const client = createAdminClient();

  const { data: job, error: jobError } = await client
    .from("jobs")
    .select("id, title, recruiter_id")
    .eq("id", jobId)
    .maybeSingle();

  if (jobError) {
    throw new AppError("INTERNAL_ERROR", "Failed to load job.", 500);
  }

  if (!job || job.recruiter_id !== recruiterId) {
    throw new AppError("NOT_FOUND", "Job not found.", 404);
  }

  const { data, error } = await client
    .from("applications")
    .select(
      "id, status, match_score, risk_evaluation, created_at, candidate:users(id, email)"
    )
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new AppError("INTERNAL_ERROR", "Failed to load applications.", 500);
  }

  return { job: { id: job.id, title: job.title }, applications: data };
}

export async function listCandidateApplications(
  candidateId: string
): Promise<CandidateApplicationListItem[]> {
  const client = createAdminClient();

  const { data, error } = await client
    .from("applications")
    .select(
      "id, job_id, status, match_score, risk_evaluation, created_at, job:jobs(id, title, department, location, employment_type, experience_level)"
    )
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new AppError("INTERNAL_ERROR", "Failed to load applications.", 500);
  }

  return data;
}

export async function getRecruiterApplicationStats(
  recruiterId: string
): Promise<RecruiterApplicationStats> {
  const client = createAdminClient();
  const { data: jobs, error: jobsError } = await client
    .from("jobs")
    .select("id")
    .eq("recruiter_id", recruiterId);

  if (jobsError) {
    throw new AppError("INTERNAL_ERROR", "Failed to load applications.", 500);
  }

  const jobIds = jobs?.map((job) => job.id) ?? [];

  if (!jobIds.length) {
    return { total: 0, pendingReview: 0, scheduled: 0, byJobId: {} };
  }

  const { data: applications, error: applicationsError } = await client
    .from("applications")
    .select("id, status, job_id")
    .in("job_id", jobIds);

  if (applicationsError || !applications) {
    throw new AppError("INTERNAL_ERROR", "Failed to load applications.", 500);
  }

  const byJobId: Record<string, number> = {};
  let pendingReview = 0;
  let scheduled = 0;

  for (const application of applications) {
    byJobId[application.job_id] = (byJobId[application.job_id] ?? 0) + 1;

    if (application.status === "interview_scheduled") {
      scheduled += 1;
    }

    if (
      application.status === "submitted" ||
      application.status === "manual_review"
    ) {
      pendingReview += 1;
    }
  }

  return {
    total: applications.length,
    pendingReview,
    scheduled,
    byJobId,
  };
}

export async function getRecruiterApplicationDetail(
  applicationId: string,
  recruiterId: string
): Promise<{
  application: ApplicationRow;
  candidate: { id: string; email: string };
  job: ApplicationDetailRow["job"];
  resume: ParsedResume | null;
}> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("applications")
    .select(
      "id, status, match_score, risk_evaluation, invited_at, created_at, parsed_resume, candidate:users(id, email), job:jobs(id, recruiter_id, title, department, location, employment_type, experience_level, description)"
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Failed to load application.", 500);
  }

  const application = data as ApplicationDetailRow | null;

  if (!application || !application.job || !application.candidate) {
    throw new AppError("NOT_FOUND", "Application not found.", 404);
  }

  if (application.job.recruiter_id !== recruiterId) {
    throw new AppError("NOT_FOUND", "Application not found.", 404);
  }

  const parsedResume =
    (application.parsed_resume as { parsed?: ParsedResume } | null)?.parsed ??
    null;

  return {
    application,
    candidate: application.candidate,
    job: application.job,
    resume: parsedResume,
  };
}

export async function inviteCandidateToInterview({
  applicationId,
  recruiterId,
  recruiterEmail,
  proposedTime,
}: {
  applicationId: string;
  recruiterId: string;
  recruiterEmail: string;
  proposedTime?: string;
}): Promise<ApplicationRow> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("applications")
    .select(
      "id, status, invited_at, parsed_resume, candidate:users(id, email), job:jobs(id, recruiter_id, title)"
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Failed to load application.", 500);
  }

  const application = data as ApplicationDetailRow | null;

  if (!application || !application.job || !application.candidate) {
    throw new AppError("NOT_FOUND", "Application not found.", 404);
  }

  if (application.job.recruiter_id !== recruiterId) {
    throw new AppError("NOT_FOUND", "Application not found.", 404);
  }

  if (application.status === "interview_scheduled") {
    return application;
  }

  const parsedResume =
    (application.parsed_resume as { parsed?: ParsedResume } | null)?.parsed ??
    null;
  const candidateName =
    parsedResume?.name ?? application.candidate.email ?? "Candidate";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const interviewLink = `${appUrl}/candidate/interview/${application.id}`;

  const sendInvite = async () =>
    sendInterviewInviteEmail({
      to: application.candidate.email,
      candidateName,
      recruiterName: recruiterEmail,
      jobTitle: application.job.title,
      interviewLink,
      proposedTime,
    });

  try {
    await sendInvite();
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      await sendInvite();
    } catch {
      throw new AppError("INTERNAL_ERROR", "Invite email failed.", 500);
    }
  }

  const { data: updated, error: updateError } = await client
    .from("applications")
    .update({
      status: "interview_scheduled",
      invited_at: new Date().toISOString(),
    })
    .eq("id", application.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new AppError("INTERNAL_ERROR", "Failed to update application.", 500);
  }

  return updated;
}
