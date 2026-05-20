import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/auth/errors";
import { withRetry } from "@/lib/utils";
import { parseResumeText, scoreApplication, type ParsedResume } from "@/lib/ai/resume";
import {
  runRecruiterEvaluationPipeline,
  type ApplicationEvaluationResult,
} from "@/lib/ai/evaluation";
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

type RecruiterPipelineItem = {
  id: string;
  status: ApplicationStatus;
  match_score: number | null;
  risk_evaluation: string | null;
  created_at: string | null;
  invited_at: string | null;
  candidate: { id: string; email: string } | null;
  job: {
    id: string;
    title: string;
    department: string;
    location: string;
  } | null;
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

type ResumePreviewAsset = {
  previewUrl: string | null;
  downloadUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  uploadedAt: string | null;
  storagePath: string | null;
  parseStatus: "parsed" | "partial" | "failed";
  parseConfidence: number | null;
  processingState:
    | "uploaded"
    | "parsing"
    | "parse_failed_gracefully"
    | "ready_for_ai_evaluation"
    | "ai_evaluating"
    | "ai_evaluation_complete"
    | "ai_evaluation_failed";
};

type ManualOverrideProfile = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  skills?: string[];
  experience?: string | null;
  education?: string | null;
};

type StoredEvaluationPayload = ApplicationEvaluationResult;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function buildResumePath({ file, jobId, candidateId }: ResumePayload): string {
  const safeName = sanitizeFileName(file.name);
  const id = crypto.randomUUID();
  return `${candidateId}/${jobId}/${id}-${safeName}`;
}

function calculateParseConfidence(parsed: ParsedResume): number {
  let score = 10;
  if (parsed.name) score += 10;
  if (parsed.email) score += 10;
  if (parsed.phone) score += 10;
  if (parsed.summary) score += 10;
  if (parsed.skills.length > 0) score += 15;
  if (parsed.work_experience.length > 0) score += 20;
  if (parsed.education.length > 0) score += 10;
  if (parsed.total_years_experience != null) score += 10;
  if (parsed.projects.length > 0 || parsed.certifications.length > 0) score += 5;
  return Math.min(100, Math.max(0, score));
}

function recommendationToStatus(recommendation: string): string {
  if (recommendation === "strongly_recommended") {
    return "Strongly Recommended";
  }
  if (recommendation === "recommended") {
    return "Recommended";
  }
  if (recommendation === "consider_with_reservations") {
    return "Consider with Reservations";
  }
  return "Not Recommended";
}

function hasManualOverrideContent(overrides: ManualOverrideProfile | null): boolean {
  if (!overrides) {
    return false;
  }
  return Boolean(
    overrides.name ||
      overrides.email ||
      overrides.phone ||
      overrides.location ||
      overrides.experience ||
      overrides.education ||
      (overrides.skills && overrides.skills.length > 0)
  );
}

function buildParsedResumeFromOverrides(
  overrides: ManualOverrideProfile,
  fallbackEmail: string | null
): ParsedResume {
  return {
    name: overrides.name ?? null,
    email: overrides.email ?? fallbackEmail ?? null,
    phone: overrides.phone ?? null,
    location: overrides.location ?? null,
    linkedin: null,
    portfolio: null,
    summary: overrides.experience ?? null,
    total_years_experience: null,
    skills: overrides.skills ?? [],
    technical_skills: overrides.skills ?? [],
    soft_skills: [],
    tools: [],
    languages: [],
    work_experience: [],
    education: overrides.education
      ? [
          {
            institution: null,
            degree: overrides.education,
            field: null,
            year: null,
            gpa: null,
          },
        ]
      : [],
    certifications: [],
    projects: [],
  };
}

async function buildResumePreviewAsset(
  client: ReturnType<typeof createAdminClient>,
  application: ApplicationRow
): Promise<ResumePreviewAsset> {
  const parsedResumeData = (application.parsed_resume ??
    null) as Record<string, unknown> | null;
  const source = (parsedResumeData?.source ?? null) as
    | Record<string, unknown>
    | null;
  const parsingMeta = (parsedResumeData?.parsing ?? null) as
    | Record<string, unknown>
    | null;
  const processing = (parsedResumeData?.processing ?? null) as
    | Record<string, unknown>
    | null;

  const storagePath =
    application.resume_path ?? (source?.storage_path as string | null) ?? null;
  const fileName = (source?.file_name as string | null) ?? null;
  const fileType = (source?.file_type as string | null) ?? null;
  const uploadedAt =
    (source?.uploaded_at as string | null) ?? application.created_at ?? null;
  const parseStatus = (parsingMeta?.status as "parsed" | "failed" | "partial") ?? "failed";
  const parseConfidence = (() => {
    const value = parsingMeta?.confidence;
    if (typeof value !== "number") {
      return null;
    }
    return Math.min(100, Math.max(0, Math.round(value)));
  })();
  const processingState =
    (processing?.state as ResumePreviewAsset["processingState"]) ??
    (parseStatus === "parsed"
      ? "ready_for_ai_evaluation"
      : "parse_failed_gracefully");

  if (!storagePath) {
    return {
      previewUrl: null,
      downloadUrl: null,
      fileName,
      fileType,
      uploadedAt,
      storagePath: null,
      parseStatus,
      parseConfidence,
      processingState,
    };
  }

  const [{ data: previewData }, { data: downloadData }] = await Promise.all([
    client.storage.from("resumes").createSignedUrl(storagePath, 60 * 60),
    client.storage
      .from("resumes")
      .createSignedUrl(storagePath, 60 * 60, { download: fileName ?? true }),
  ]);

  return {
    previewUrl: previewData?.signedUrl ?? null,
    downloadUrl: downloadData?.signedUrl ?? null,
    fileName,
    fileType,
    uploadedAt,
    storagePath,
    parseStatus,
    parseConfidence,
    processingState,
  };
}

async function recoverParsedResumeForEvaluation({
  client,
  applicationId,
  parsedResumeData,
  resumePath,
  candidateEmail,
  manualOverrides,
}: {
  client: ReturnType<typeof createAdminClient>;
  applicationId: string;
  parsedResumeData: Record<string, unknown> | null;
  resumePath: string | null;
  candidateEmail: string | null;
  manualOverrides: ManualOverrideProfile | null;
}): Promise<{
  parsed: ParsedResume | null;
  rawText: string | null;
  source: "raw_text" | "file" | "manual_override" | "none";
}> {
  const existingRawText =
    (parsedResumeData?.raw_text as string | null | undefined) ?? null;

  if (existingRawText) {
    try {
      const parsed = await withRetry(() => parseResumeText(existingRawText), 2);
      return { parsed, rawText: existingRawText, source: "raw_text" };
    } catch {
      // continue to file recovery
    }
  }

  const sourceData = (parsedResumeData?.source ??
    null) as Record<string, unknown> | null;
  const storagePath =
    resumePath ?? (sourceData?.storage_path as string | null) ?? null;
  const sourceName =
    (sourceData?.file_name as string | null) ?? `resume-${applicationId}.pdf`;
  const sourceType =
    (sourceData?.file_type as string | null) ?? "application/octet-stream";

  if (storagePath) {
    const { data: fileBlob, error } = await client.storage
      .from("resumes")
      .download(storagePath);

    if (!error && fileBlob) {
      const recoveredFile = new File([fileBlob], sourceName, {
        type: sourceType || fileBlob.type || "application/octet-stream",
      });
      try {
        const extractedText = await withRetry(
          () => extractResumeText(recoveredFile),
          2
        );
        const parsed = await withRetry(() => parseResumeText(extractedText), 2);
        return { parsed, rawText: extractedText, source: "file" };
      } catch {
        // continue to manual override fallback
      }
    }
  }

  if (hasManualOverrideContent(manualOverrides)) {
    return {
      parsed: buildParsedResumeFromOverrides(
        manualOverrides as ManualOverrideProfile,
        candidateEmail
      ),
      rawText: null,
      source: "manual_override",
    };
  }

  return { parsed: null, rawText: null, source: "none" };
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

  return {
    job: { id: job.id, title: job.title },
    applications: data as unknown as RecruiterApplicationListItem[],
  };
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

  return data as unknown as CandidateApplicationListItem[];
}

export async function listRecruiterApplications(
  recruiterId: string
): Promise<RecruiterPipelineItem[]> {
  const client = createAdminClient();

  const { data: jobs, error: jobsError } = await client
    .from("jobs")
    .select("id, title, department, location")
    .eq("recruiter_id", recruiterId);

  if (jobsError) {
    throw new AppError("INTERNAL_ERROR", "Failed to load applications.", 500);
  }

  const jobIds = jobs?.map((job) => job.id) ?? [];

  if (!jobIds.length) {
    return [];
  }

  const { data, error } = await client
    .from("applications")
    .select(
      "id, status, match_score, risk_evaluation, created_at, invited_at, candidate:users(id, email), job:jobs(id, title, department, location)"
    )
    .in("job_id", jobIds)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new AppError("INTERNAL_ERROR", "Failed to load applications.", 500);
  }

  return data as unknown as RecruiterPipelineItem[];
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
  resumeText: string | null;
  manualOverrides: ManualOverrideProfile | null;
  resumeAsset: ResumePreviewAsset;
  latestEvaluation: StoredEvaluationPayload | null;
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
  const resumeText =
    (application.parsed_resume as { raw_text?: string | null } | null)
      ?.raw_text ?? null;
  const manualOverrides =
    (application.parsed_resume as { manual_overrides?: ManualOverrideProfile } | null)
      ?.manual_overrides ?? null;
  const resumeAsset = await buildResumePreviewAsset(client, application);

  const { data: latestEvaluationData } = await client
    .from("application_evaluations")
    .select("payload")
    .eq("application_id", application.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latestEvaluation =
    (latestEvaluationData?.payload as StoredEvaluationPayload | null) ??
    (((application.parsed_resume as Record<string, unknown> | null)?.scoring as StoredEvaluationPayload | null) ??
      null);

  return {
    application,
    candidate: application.candidate,
    job: application.job,
    resume: parsedResume,
    resumeText,
    manualOverrides,
    resumeAsset,
    latestEvaluation,
  };
}

export async function updateApplicationManualOverrides({
  applicationId,
  recruiterId,
  overrides,
}: {
  applicationId: string;
  recruiterId: string;
  overrides: ManualOverrideProfile;
}): Promise<ManualOverrideProfile> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("applications")
    .select("id, parsed_resume, job:jobs(id, recruiter_id)")
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Failed to load application.", 500);
  }

  const application = data as
    | (ApplicationRow & {
        job: { id: string; recruiter_id: string } | null;
      })
    | null;
  if (!application || !application.job || application.job.recruiter_id !== recruiterId) {
    throw new AppError("NOT_FOUND", "Application not found.", 404);
  }

  const parsedResume = (application.parsed_resume ?? {}) as Record<string, unknown>;
  const nextParsedResume = {
    ...parsedResume,
    manual_overrides: overrides,
  };

  const { error: updateError } = await client
    .from("applications")
    .update({ parsed_resume: nextParsedResume })
    .eq("id", applicationId);

  if (updateError) {
    throw new AppError("INTERNAL_ERROR", "Failed to save manual overrides.", 500);
  }

  return overrides;
}

export async function runApplicationEvaluation({
  applicationId,
  recruiterId,
}: {
  applicationId: string;
  recruiterId: string;
}): Promise<StoredEvaluationPayload> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("applications")
    .select(
      "id, status, parsed_resume, match_score, risk_evaluation, resume_path, candidate:users(id, email), job:jobs(id, recruiter_id, title, department, location, employment_type, required_skills, preferred_skills, experience_level, description)"
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Failed to load application.", 500);
  }

  const application = data as
    | (ApplicationRow & {
        candidate: { id: string; email: string } | null;
        job: {
          id: string;
          recruiter_id: string;
          title: string;
          department: string;
          location: string;
          employment_type: string;
          required_skills: string[];
          preferred_skills: string[] | null;
          experience_level: string;
          description: string;
        } | null;
      })
    | null;

  if (!application || !application.job) {
    throw new AppError("NOT_FOUND", "Application not found.", 404);
  }
  if (application.job.recruiter_id !== recruiterId) {
    throw new AppError("NOT_FOUND", "Application not found.", 404);
  }

  let parsedResumeData = (application.parsed_resume ??
    null) as Record<string, unknown> | null;
  let parsed = (parsedResumeData?.parsed ?? null) as ParsedResume | null;
  const manualOverrides = (parsedResumeData?.manual_overrides ??
    null) as ManualOverrideProfile | null;

  if (!parsed) {
    const recovery = await recoverParsedResumeForEvaluation({
      client,
      applicationId: application.id,
      parsedResumeData,
      resumePath: application.resume_path,
      candidateEmail: application.candidate?.email ?? null,
      manualOverrides,
    });

    if (recovery.parsed) {
      parsed = recovery.parsed;
      parsedResumeData = {
        ...(parsedResumeData ?? {}),
        parsed: recovery.parsed,
        raw_text:
          recovery.rawText ??
          ((parsedResumeData?.raw_text as string | null | undefined) ?? null),
        parsed_at: new Date().toISOString(),
        parsing: {
          status: recovery.source === "manual_override" ? "partial" : "parsed",
          confidence:
            recovery.source === "manual_override"
              ? 55
              : calculateParseConfidence(recovery.parsed),
          recovered_from: recovery.source,
        },
      };

      await client
        .from("applications")
        .update({
          parsed_resume:
            parsedResumeData as Database["public"]["Tables"]["applications"]["Row"]["parsed_resume"],
        })
        .eq("id", application.id);
    }
  }

  if (!parsed) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Unable to parse this resume automatically yet. Please use Manual Override fields and run evaluation again.",
      400
    );
  }

  const evaluation = await runRecruiterEvaluationPipeline({
    resume: parsed,
    job: {
      title: application.job.title,
      department: application.job.department,
      location: application.job.location,
      employmentType: application.job.employment_type,
      requiredSkills: application.job.required_skills,
      preferredSkills: application.job.preferred_skills,
      experienceLevel: application.job.experience_level,
      description: application.job.description,
    },
    manualOverrides: manualOverrides as Record<string, unknown> | null,
  });

  const updatedParsedResume = {
    ...(parsedResumeData ?? {}),
    scoring: evaluation,
    processing: {
      state: "ai_evaluation_complete",
      stages: {
        uploaded: true,
        parsed: true,
        ai_evaluated: true,
      },
    },
    evaluated_at: evaluation.evaluated_at,
  };

  const riskEvaluation = [
    evaluation.candidate_summary,
    evaluation.recommendation_rationale,
    evaluation.risk_factors.length
      ? `Risk factors: ${evaluation.risk_factors.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const { error: applicationUpdateError } = await client
    .from("applications")
    .update({
      match_score: evaluation.overall_match_score,
      risk_evaluation: riskEvaluation,
      parsed_resume: updatedParsedResume,
      status:
        application.status === "manual_review" ? "reviewed" : application.status,
    })
    .eq("id", application.id);

  if (applicationUpdateError) {
    throw new AppError("INTERNAL_ERROR", "Failed to save AI evaluation.", 500);
  }

  await client.from("application_evaluations").insert({
    application_id: application.id,
    model: evaluation.model,
    prompt_version: evaluation.prompt_version,
    evaluation_version: evaluation.evaluation_version,
    overall_match_score: evaluation.overall_match_score,
    skills_match_score: evaluation.skills_match_score,
    experience_match_score: evaluation.experience_match_score,
    education_match_score: evaluation.education_match_score,
    hiring_recommendation: recommendationToStatus(
      evaluation.hiring_recommendation
    ),
    payload: evaluation,
  });

  return evaluation;
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

  const candidate = application.candidate;
  const job = application.job;

  const parsedResume =
    (application.parsed_resume as { parsed?: ParsedResume } | null)?.parsed ??
    null;
  const candidateName =
    parsedResume?.name ?? candidate.email ?? "Candidate";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const interviewLink = `${appUrl}/candidate/interview/${application.id}`;

  const sendInvite = async () =>
    sendInterviewInviteEmail({
      to: candidate.email,
      candidateName,
      recruiterName: recruiterEmail,
      jobTitle: job.title,
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

export async function updateApplicationStatus({
  applicationId,
  recruiterId,
  status,
}: {
  applicationId: string;
  recruiterId: string;
  status: ApplicationStatus;
}): Promise<ApplicationRow> {
  const client = createAdminClient();
  const { data: application, error: applicationError } = await client
    .from("applications")
    .select("id, status, job:jobs(id, recruiter_id)")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError) {
    throw new AppError("INTERNAL_ERROR", "Failed to load application.", 500);
  }

  const job = application?.job as { recruiter_id?: string } | null;
  if (!application || job?.recruiter_id !== recruiterId) {
    throw new AppError("NOT_FOUND", "Application not found.", 404);
  }

  const { data: updated, error } = await client
    .from("applications")
    .update({ status })
    .eq("id", applicationId)
    .select("*")
    .single();

  if (error || !updated) {
    throw new AppError("INTERNAL_ERROR", "Failed to update application.", 500);
  }

  return updated;
}
