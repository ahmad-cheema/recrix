import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/auth/errors";
import { withRetry } from "@/lib/utils";
import { generateInterviewQuestions } from "@/lib/ai/interviews";
import type { Database } from "@/lib/supabase/database";

const QUESTION_COUNT = 7;

type InterviewSessionRow =
  Database["public"]["Tables"]["interview_sessions"]["Row"];

type InterviewAnswerEntry = {
  questionIndex: number;
  question: string;
  answer: string;
  feedback: string;
  created_at: string;
};

export async function createInterviewSession(
  applicationId: string,
  candidateId: string
): Promise<InterviewSessionRow> {
  try {
    const client = createAdminClient();

    const { data: applicationData, error: applicationError } = await client
      .from("applications")
      .select(
        "id, status, candidate_id, job:jobs(id, title, description)"
      )
      .eq("id", applicationId)
      .maybeSingle();

    const application = applicationData as {
      id: string;
      status: string;
      candidate_id: string;
      job: { id: string; title: string; description: string } | null;
    } | null;

    if (applicationError) {
      throw new AppError("INTERNAL_ERROR", "Failed to load application.", 500);
    }

    if (!application || application.candidate_id !== candidateId) {
      throw new AppError("NOT_FOUND", "Application not found.", 404);
    }

    if (application.status !== "interview_scheduled") {
      throw new AppError("UNAUTHORIZED", "Interview not available.", 403);
    }

    const { data: existing } = await client
      .from("interview_sessions")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && existing.status === "in_progress") {
      return existing;
    }

    const questions = await withRetry(
      () =>
        generateInterviewQuestions({
          jobTitle: application.job?.title ?? "Role",
          jobDescription: application.job?.description ?? "",
          count: QUESTION_COUNT,
        }),
      2
    );

    const { data: session, error: sessionError } = await client
      .from("interview_sessions")
      .insert({
        application_id: applicationId,
        questions,
        answers: [],
        status: "in_progress",
      })
      .select("*")
      .single();

    if (sessionError || !session) {
      throw new AppError("INTERNAL_ERROR", "Failed to create session.", 500);
    }

    return session;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "Failed to create session.", 500);
  }
}

export async function getInterviewSessionForCandidate(
  sessionId: string,
  candidateId: string
): Promise<{ session: InterviewSessionRow; jobTitle: string }> {
  try {
    const client = createAdminClient();
    const { data, error } = await client
      .from("interview_sessions")
      .select(
        "id, questions, answers, status, application:applications(id, candidate_id, job:jobs(id, title))"
      )
      .eq("id", sessionId)
      .maybeSingle();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to load session.", 500);
    }

    const session = data as
      | (InterviewSessionRow & {
          application?: { candidate_id?: string; job?: { title?: string } };
        })
      | null;

    if (!session || session.application?.candidate_id !== candidateId) {
      throw new AppError("NOT_FOUND", "Session not found.", 404);
    }

    return {
      session,
      jobTitle: session.application?.job?.title ?? "Interview",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "Failed to load session.", 500);
  }
}

export async function appendInterviewAnswer({
  sessionId,
  candidateId,
  questionIndex,
  question,
  answer,
  feedback,
}: {
  sessionId: string;
  candidateId: string;
  questionIndex: number;
  question: string;
  answer: string;
  feedback: string;
}): Promise<InterviewSessionRow> {
  try {
    const client = createAdminClient();
    const { data, error } = await client
      .from("interview_sessions")
      .select(
        "id, questions, answers, status, application:applications(id, candidate_id)"
      )
      .eq("id", sessionId)
      .maybeSingle();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to load session.", 500);
    }

    const session = data as
      | (InterviewSessionRow & {
          application?: { candidate_id?: string };
        })
      | null;

    if (!session || session.application?.candidate_id !== candidateId) {
      throw new AppError("NOT_FOUND", "Session not found.", 404);
    }

    const questions = (session.questions as string[] | null) ?? [];

    if (!questions.length || questionIndex >= questions.length) {
      throw new AppError("VALIDATION_ERROR", "Invalid question index.", 400);
    }

    const existingAnswers = (session.answers as InterviewAnswerEntry[] | null) ?? [];
    const filtered = existingAnswers.filter(
      (item) => item.questionIndex !== questionIndex
    );

    const nextAnswers = [
      ...filtered,
      {
        questionIndex,
        question,
        answer,
        feedback,
        created_at: new Date().toISOString(),
      },
    ].sort((a, b) => a.questionIndex - b.questionIndex);

    const nextStatus =
      nextAnswers.length >= questions.length ? "completed" : session.status;

    const { data: updated, error: updateError } = await client
      .from("interview_sessions")
      .update({ answers: nextAnswers, status: nextStatus })
      .eq("id", sessionId)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw new AppError("INTERNAL_ERROR", "Failed to update session.", 500);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "Failed to update session.", 500);
  }
}

export async function listInterviewSessionsForApplication(
  applicationId: string,
  recruiterId: string
): Promise<InterviewSessionRow[]> {
  try {
    const client = createAdminClient();
    const { data: application, error: applicationError } = await client
      .from("applications")
      .select("id, job:jobs(id, recruiter_id)")
      .eq("id", applicationId)
      .maybeSingle();

    if (applicationError) {
      throw new AppError("INTERNAL_ERROR", "Failed to load application.", 500);
    }

    const job = application?.job as { recruiter_id?: string } | null;
    if (!application || job?.recruiter_id !== recruiterId) {
      throw new AppError("NOT_FOUND", "Application not found.", 404);
    }

    const { data, error } = await client
      .from("interview_sessions")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      throw new AppError("INTERNAL_ERROR", "Failed to load sessions.", 500);
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "Failed to load sessions.", 500);
  }
}

export async function listInterviewSessionsForApplications(
  applicationIds: string[]
): Promise<InterviewSessionRow[]> {
  if (!applicationIds.length) {
    return [];
  }

  try {
    const client = createAdminClient();
    const { data, error } = await client
      .from("interview_sessions")
      .select("*")
      .in("application_id", applicationIds)
      .order("created_at", { ascending: false });

    if (error || !data) {
      throw new AppError("INTERNAL_ERROR", "Failed to load sessions.", 500);
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "Failed to load sessions.", 500);
  }
}
