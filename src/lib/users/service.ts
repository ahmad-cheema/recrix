import "server-only";

import { AppError } from "@/lib/auth/errors";
import { hashPassword } from "@/lib/auth/password";
import { validateResumeFile } from "@/lib/resume/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database";
import type {
  CandidateNotificationSettings,
  CandidateProfile,
  CandidateSettings,
  RecruiterCompanyProfile,
  RecruiterHiringPreferences,
  RecruiterNotificationSettings,
  RecruiterSettings,
} from "./types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type UserMetadata = {
  candidate_profile?: {
    full_name?: string | null;
    current_title?: string | null;
    location?: string | null;
    portfolio_url?: string | null;
    summary?: string | null;
    resume?: {
      storage_path?: string | null;
      file_name?: string | null;
      file_type?: string | null;
      uploaded_at?: string | null;
    } | null;
  } | null;
  candidate_settings?: {
    notifications?: {
      interview_invites?: boolean;
      weekly_updates?: boolean;
      sms_reminders?: boolean;
    } | null;
  } | null;
  recruiter_settings?: {
    company_profile?: {
      company_name?: string | null;
      industry?: string | null;
      website?: string | null;
      hq_location?: string | null;
      company_overview?: string | null;
    } | null;
    hiring_preferences?: {
      auto_score_resumes?: boolean;
      notify_high_match?: boolean;
      allow_slot_requests?: boolean;
    } | null;
    notifications?: {
      daily_summaries?: boolean;
      slack_alerts?: boolean;
      weekly_report?: boolean;
    } | null;
  } | null;
};

type CandidateProfileInput = {
  fullName?: string | null;
  currentTitle?: string | null;
  location?: string | null;
  portfolioUrl?: string | null;
  summary?: string | null;
};

type RecruiterCompanyProfileInput = {
  companyName?: string | null;
  industry?: string | null;
  website?: string | null;
  hqLocation?: string | null;
  companyOverview?: string | null;
};

const DEFAULT_CANDIDATE_NOTIFICATIONS: CandidateNotificationSettings = {
  interviewInvites: true,
  weeklyUpdates: true,
  smsReminders: false,
};

const DEFAULT_RECRUITER_HIRING: RecruiterHiringPreferences = {
  autoScoreResumes: true,
  notifyHighMatch: true,
  allowSlotRequests: false,
};

const DEFAULT_RECRUITER_NOTIFICATIONS: RecruiterNotificationSettings = {
  dailySummaries: true,
  slackAlerts: true,
  weeklyReport: false,
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function getMetadata(user: Pick<UserRow, "metadata">): UserMetadata {
  return asRecord(user.metadata) as UserMetadata;
}

function sanitizeText(value: string | null | undefined, max = 2000): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, max);
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function readBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeCandidateNotifications(
  metadata: UserMetadata
): CandidateNotificationSettings {
  const source = metadata.candidate_settings?.notifications;
  return {
    interviewInvites: readBool(
      source?.interview_invites,
      DEFAULT_CANDIDATE_NOTIFICATIONS.interviewInvites
    ),
    weeklyUpdates: readBool(
      source?.weekly_updates,
      DEFAULT_CANDIDATE_NOTIFICATIONS.weeklyUpdates
    ),
    smsReminders: readBool(
      source?.sms_reminders,
      DEFAULT_CANDIDATE_NOTIFICATIONS.smsReminders
    ),
  };
}

function normalizeRecruiterCompanyProfile(
  metadata: UserMetadata
): RecruiterCompanyProfile {
  const source = metadata.recruiter_settings?.company_profile;
  return {
    companyName: source?.company_name ?? "",
    industry: source?.industry ?? "",
    website: source?.website ?? "",
    hqLocation: source?.hq_location ?? "",
    companyOverview: source?.company_overview ?? "",
  };
}

function normalizeRecruiterHiringPreferences(
  metadata: UserMetadata
): RecruiterHiringPreferences {
  const source = metadata.recruiter_settings?.hiring_preferences;
  return {
    autoScoreResumes: readBool(
      source?.auto_score_resumes,
      DEFAULT_RECRUITER_HIRING.autoScoreResumes
    ),
    notifyHighMatch: readBool(
      source?.notify_high_match,
      DEFAULT_RECRUITER_HIRING.notifyHighMatch
    ),
    allowSlotRequests: readBool(
      source?.allow_slot_requests,
      DEFAULT_RECRUITER_HIRING.allowSlotRequests
    ),
  };
}

function normalizeRecruiterNotifications(
  metadata: UserMetadata
): RecruiterNotificationSettings {
  const source = metadata.recruiter_settings?.notifications;
  return {
    dailySummaries: readBool(
      source?.daily_summaries,
      DEFAULT_RECRUITER_NOTIFICATIONS.dailySummaries
    ),
    slackAlerts: readBool(
      source?.slack_alerts,
      DEFAULT_RECRUITER_NOTIFICATIONS.slackAlerts
    ),
    weeklyReport: readBool(
      source?.weekly_report,
      DEFAULT_RECRUITER_NOTIFICATIONS.weeklyReport
    ),
  };
}

async function getUserOrThrow(userId: string): Promise<UserRow> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Failed to load user.", 500);
  }

  if (!data) {
    throw new AppError("NOT_FOUND", "User not found.", 404);
  }

  return data;
}

function assertRole(user: UserRow, expectedRole: UserRow["role"]) {
  if (user.role !== expectedRole) {
    throw new AppError("UNAUTHORIZED", "Forbidden.", 403);
  }
}

export async function getCandidateProfile(userId: string): Promise<CandidateProfile> {
  const client = createAdminClient();
  const user = await getUserOrThrow(userId);
  assertRole(user, "candidate");

  const metadata = getMetadata(user);
  const profile = metadata.candidate_profile ?? null;
  const resumeMeta = profile?.resume ?? null;
  let downloadUrl: string | null = null;

  if (resumeMeta?.storage_path) {
    const { data } = await client.storage
      .from("resumes")
      .createSignedUrl(resumeMeta.storage_path, 60 * 60);
    downloadUrl = data?.signedUrl ?? null;
  }

  return {
    fullName: profile?.full_name ?? "",
    currentTitle: profile?.current_title ?? "",
    location: profile?.location ?? "",
    portfolioUrl: profile?.portfolio_url ?? "",
    summary: profile?.summary ?? "",
    resume:
      resumeMeta?.file_name && resumeMeta.uploaded_at
        ? {
            fileName: resumeMeta.file_name,
            uploadedAt: resumeMeta.uploaded_at,
            downloadUrl,
          }
        : null,
  };
}

export async function updateCandidateProfile(
  userId: string,
  input: CandidateProfileInput
): Promise<CandidateProfile> {
  const client = createAdminClient();
  const user = await getUserOrThrow(userId);
  assertRole(user, "candidate");

  const metadata = getMetadata(user);
  const nextMetadata: UserMetadata = {
    ...metadata,
    candidate_profile: {
      ...(metadata.candidate_profile ?? {}),
      full_name: sanitizeText(input.fullName, 120),
      current_title: sanitizeText(input.currentTitle, 120),
      location: sanitizeText(input.location, 120),
      portfolio_url: sanitizeText(input.portfolioUrl, 300),
      summary: sanitizeText(input.summary, 2000),
    },
  };

  const { error } = await client
    .from("users")
    .update({ metadata: nextMetadata as unknown as UserRow["metadata"] })
    .eq("id", userId);

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Failed to save profile.", 500);
  }

  return getCandidateProfile(userId);
}

export async function uploadCandidateResume(
  userId: string,
  file: File
): Promise<CandidateProfile["resume"]> {
  const validation = validateResumeFile(file);
  if (!validation.ok) {
    throw new AppError("VALIDATION_ERROR", validation.error, 400);
  }

  const client = createAdminClient();
  const user = await getUserOrThrow(userId);
  assertRole(user, "candidate");

  const metadata = getMetadata(user);
  const currentResumePath =
    metadata.candidate_profile?.resume?.storage_path ?? null;
  const safeName = sanitizeFileName(file.name);
  const storagePath = `${userId}/profile/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await client.storage
    .from("resumes")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new AppError("INTERNAL_ERROR", "Resume upload failed.", 500);
  }

  const uploadedAt = new Date().toISOString();
  const nextMetadata: UserMetadata = {
    ...metadata,
    candidate_profile: {
      ...(metadata.candidate_profile ?? {}),
      resume: {
        storage_path: storagePath,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        uploaded_at: uploadedAt,
      },
    },
  };

  const { error: updateError } = await client
    .from("users")
    .update({ metadata: nextMetadata as unknown as UserRow["metadata"] })
    .eq("id", userId);

  if (updateError) {
    await client.storage.from("resumes").remove([storagePath]);
    throw new AppError("INTERNAL_ERROR", "Resume upload failed.", 500);
  }

  if (currentResumePath && currentResumePath !== storagePath) {
    await client.storage.from("resumes").remove([currentResumePath]).catch(() => {});
  }

  const { data } = await client.storage
    .from("resumes")
    .createSignedUrl(storagePath, 60 * 60);

  return {
    fileName: file.name,
    uploadedAt,
    downloadUrl: data?.signedUrl ?? null,
  };
}

export async function getCandidateSettings(userId: string): Promise<CandidateSettings> {
  const user = await getUserOrThrow(userId);
  assertRole(user, "candidate");
  const metadata = getMetadata(user);

  return {
    email: user.email,
    notifications: normalizeCandidateNotifications(metadata),
  };
}

export async function updateCandidateAccountSettings({
  userId,
  email,
  newPassword,
}: {
  userId: string;
  email?: string;
  newPassword?: string;
}): Promise<{ email: string }> {
  const client = createAdminClient();
  const user = await getUserOrThrow(userId);
  assertRole(user, "candidate");

  const nextEmail = email?.trim().toLowerCase();
  const nextPassword = newPassword?.trim();

  const updates: Database["public"]["Tables"]["users"]["Update"] = {};

  if (nextEmail) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(nextEmail)) {
      throw new AppError("VALIDATION_ERROR", "Invalid email address.", 400);
    }

    if (nextEmail !== user.email) {
      const { data: existing, error: existingError } = await client
        .from("users")
        .select("id")
        .eq("email", nextEmail)
        .neq("id", userId)
        .maybeSingle();

      if (existingError) {
        throw new AppError("INTERNAL_ERROR", "Failed to update account.", 500);
      }

      if (existing) {
        throw new AppError("CONFLICT", "Email already in use.", 409);
      }

      updates.email = nextEmail;
    }
  }

  if (nextPassword) {
    if (nextPassword.length < 8) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Password must be at least 8 characters.",
        400
      );
    }
    updates.password_hash = await hashPassword(nextPassword);
  }

  if (!Object.keys(updates).length) {
    return { email: user.email };
  }

  const { data, error } = await client
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select("email")
    .single();

  if (error || !data) {
    throw new AppError("INTERNAL_ERROR", "Failed to update account.", 500);
  }

  return { email: data.email };
}

export async function updateCandidateNotificationSettings(
  userId: string,
  notifications: CandidateNotificationSettings
): Promise<CandidateNotificationSettings> {
  const client = createAdminClient();
  const user = await getUserOrThrow(userId);
  assertRole(user, "candidate");

  const metadata = getMetadata(user);
  const nextMetadata: UserMetadata = {
    ...metadata,
    candidate_settings: {
      ...(metadata.candidate_settings ?? {}),
      notifications: {
        interview_invites: notifications.interviewInvites,
        weekly_updates: notifications.weeklyUpdates,
        sms_reminders: notifications.smsReminders,
      },
    },
  };

  const { error } = await client
    .from("users")
    .update({ metadata: nextMetadata as unknown as UserRow["metadata"] })
    .eq("id", userId);

  if (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Failed to save notification settings.",
      500
    );
  }

  return notifications;
}

export async function getRecruiterSettings(userId: string): Promise<RecruiterSettings> {
  const user = await getUserOrThrow(userId);
  assertRole(user, "recruiter");
  const metadata = getMetadata(user);

  return {
    companyProfile: normalizeRecruiterCompanyProfile(metadata),
    hiringPreferences: normalizeRecruiterHiringPreferences(metadata),
    notifications: normalizeRecruiterNotifications(metadata),
  };
}

export async function updateRecruiterCompanyProfile(
  userId: string,
  input: RecruiterCompanyProfileInput
): Promise<RecruiterCompanyProfile> {
  const client = createAdminClient();
  const user = await getUserOrThrow(userId);
  assertRole(user, "recruiter");

  const metadata = getMetadata(user);
  const nextMetadata: UserMetadata = {
    ...metadata,
    recruiter_settings: {
      ...(metadata.recruiter_settings ?? {}),
      company_profile: {
        company_name: sanitizeText(input.companyName, 120),
        industry: sanitizeText(input.industry, 120),
        website: sanitizeText(input.website, 300),
        hq_location: sanitizeText(input.hqLocation, 120),
        company_overview: sanitizeText(input.companyOverview, 2000),
      },
    },
  };

  const { error } = await client
    .from("users")
    .update({ metadata: nextMetadata as unknown as UserRow["metadata"] })
    .eq("id", userId);

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Failed to save company profile.", 500);
  }

  return normalizeRecruiterCompanyProfile(nextMetadata);
}

export async function updateRecruiterHiringPreferences(
  userId: string,
  preferences: RecruiterHiringPreferences
): Promise<RecruiterHiringPreferences> {
  const client = createAdminClient();
  const user = await getUserOrThrow(userId);
  assertRole(user, "recruiter");

  const metadata = getMetadata(user);
  const nextMetadata: UserMetadata = {
    ...metadata,
    recruiter_settings: {
      ...(metadata.recruiter_settings ?? {}),
      hiring_preferences: {
        auto_score_resumes: preferences.autoScoreResumes,
        notify_high_match: preferences.notifyHighMatch,
        allow_slot_requests: preferences.allowSlotRequests,
      },
    },
  };

  const { error } = await client
    .from("users")
    .update({ metadata: nextMetadata as unknown as UserRow["metadata"] })
    .eq("id", userId);

  if (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Failed to save hiring preferences.",
      500
    );
  }

  return preferences;
}

export async function updateRecruiterNotificationSettings(
  userId: string,
  notifications: RecruiterNotificationSettings
): Promise<RecruiterNotificationSettings> {
  const client = createAdminClient();
  const user = await getUserOrThrow(userId);
  assertRole(user, "recruiter");

  const metadata = getMetadata(user);
  const nextMetadata: UserMetadata = {
    ...metadata,
    recruiter_settings: {
      ...(metadata.recruiter_settings ?? {}),
      notifications: {
        daily_summaries: notifications.dailySummaries,
        slack_alerts: notifications.slackAlerts,
        weekly_report: notifications.weeklyReport,
      },
    },
  };

  const { error } = await client
    .from("users")
    .update({ metadata: nextMetadata as unknown as UserRow["metadata"] })
    .eq("id", userId);

  if (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Failed to save notification settings.",
      500
    );
  }

  return notifications;
}
