import "server-only";

import { z } from "zod";
import { AppError } from "@/lib/auth/errors";
import { requestOpenAiJson } from "@/lib/ai/openai";
import type { JobSummary, ParsedResume } from "@/lib/ai/resume";
import {
  CANDIDATE_MATCH_PROMPT,
  CANDIDATE_MATCH_PROMPT_VERSION,
} from "@/lib/ai/prompts/evaluation/candidate-match";
import {
  INTERVIEW_QUESTIONS_PROMPT,
  INTERVIEW_QUESTIONS_PROMPT_VERSION,
} from "@/lib/ai/prompts/evaluation/interview-questions";
import {
  JOB_REQUIREMENTS_PROMPT,
  JOB_REQUIREMENTS_PROMPT_VERSION,
} from "@/lib/ai/prompts/evaluation/job-requirements";
import {
  RECOMMENDATION_PROMPT,
  RECOMMENDATION_PROMPT_VERSION,
} from "@/lib/ai/prompts/evaluation/recommendation";
import {
  RESUME_EXTRACTION_PROMPT,
  RESUME_EXTRACTION_PROMPT_VERSION,
} from "@/lib/ai/prompts/evaluation/resume-extraction";

const SCORE = z.number().int().min(0).max(100);

const ResumeExtractionSchema = z.object({
  candidate_profile: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    location: z.string().nullable(),
    years_experience: z.number().nullable(),
    skills: z.array(z.string()),
    certifications: z.array(z.string()),
    projects: z.array(z.string()),
    communication_indicators: z.array(z.string()),
    leadership_indicators: z.array(z.string()),
    career_progression_signals: z.array(z.string()),
  }),
  resume_quality: z.object({
    professionalism_score: SCORE,
    keyword_stuffing_risk: SCORE,
    clarity_notes: z.array(z.string()),
  }),
  uncertainty_notes: z.array(z.string()),
});

const JobRequirementsSchema = z.object({
  requirements: z.object({
    must_have_skills: z.array(z.string()),
    nice_to_have_skills: z.array(z.string()),
    minimum_experience_expectation: z.string(),
    seniority_expectation: z.string(),
    domain_context: z.string(),
    leadership_expectation: z.string(),
    communication_expectation: z.string(),
  }),
  evaluation_weights: z.object({
    skills: SCORE,
    experience: SCORE,
    education: SCORE,
    industry: SCORE,
    leadership: SCORE,
    communication: SCORE,
  }),
  uncertainty_notes: z.array(z.string()),
});

const CandidateMatchSchema = z.object({
  overall_match_score: SCORE,
  skills_match_score: SCORE,
  experience_match_score: SCORE,
  education_match_score: SCORE,
  industry_relevance_score: SCORE,
  leadership_alignment_score: SCORE,
  communication_indicators_score: SCORE,
  candidate_summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missing_skills: z.array(z.string()),
  risk_factors: z.array(z.string()),
  career_progression_analysis: z.string(),
  confidence_score: SCORE,
  uncertainty_notes: z.array(z.string()),
});

const RecommendationSchema = z.object({
  hiring_recommendation: z.enum([
    "strongly_recommended",
    "recommended",
    "consider_with_reservations",
    "not_recommended",
  ]),
  recommendation_rationale: z.string(),
});

const InterviewQuestionsSchema = z.object({
  recommended_interview_questions: z.array(z.string()).min(5).max(7),
});

export type HiringRecommendation = z.infer<
  typeof RecommendationSchema
>["hiring_recommendation"];

export type ApplicationEvaluationResult = {
  overall_match_score: number;
  skills_match_score: number;
  experience_match_score: number;
  education_match_score: number;
  industry_relevance_score: number;
  leadership_alignment_score: number;
  communication_indicators_score: number;
  candidate_summary: string;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  risk_factors: string[];
  career_progression_analysis: string;
  recommended_interview_questions: string[];
  hiring_recommendation: HiringRecommendation;
  recommendation_rationale: string;
  confidence_score: number;
  uncertainty_notes: string[];
  model: string;
  prompt_version: string;
  evaluation_version: string;
  evaluated_at: string;
};

const EVALUATION_VERSION = "2.1";
const DEFAULT_MODEL = "gpt-4o-mini";

async function requestStructuredWithRetry<T>(
  systemPrompt: string,
  userPayload: unknown,
  schema: z.ZodSchema<T>
): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const raw = await requestOpenAiJson<unknown>([
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ]);
      return schema.parse(raw);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw new AppError(
      "INTERNAL_ERROR",
      `AI evaluation failed schema validation: ${lastError.message}`,
      500
    );
  }
  throw new AppError("INTERNAL_ERROR", "AI evaluation failed.", 500);
}

export async function runRecruiterEvaluationPipeline({
  resume,
  job,
  manualOverrides,
}: {
  resume: ParsedResume;
  job: JobSummary;
  manualOverrides?: Record<string, unknown> | null;
}): Promise<ApplicationEvaluationResult> {
  const extraction = await requestStructuredWithRetry(
    RESUME_EXTRACTION_PROMPT,
    { resume, manual_overrides: manualOverrides ?? null },
    ResumeExtractionSchema
  );

  const jobRequirements = await requestStructuredWithRetry(
    JOB_REQUIREMENTS_PROMPT,
    { job },
    JobRequirementsSchema
  );

  const match = await requestStructuredWithRetry(
    CANDIDATE_MATCH_PROMPT,
    {
      resume_extraction: extraction,
      job_requirements: jobRequirements,
      raw_job: job,
    },
    CandidateMatchSchema
  );

  const recommendation = await requestStructuredWithRetry(
    RECOMMENDATION_PROMPT,
    { match_analysis: match },
    RecommendationSchema
  );

  const interviewQuestions = await requestStructuredWithRetry(
    INTERVIEW_QUESTIONS_PROMPT,
    {
      match_analysis: match,
      recommendation,
    },
    InterviewQuestionsSchema
  );

  return {
    ...match,
    recommended_interview_questions:
      interviewQuestions.recommended_interview_questions,
    hiring_recommendation: recommendation.hiring_recommendation,
    recommendation_rationale: recommendation.recommendation_rationale,
    uncertainty_notes: Array.from(
      new Set([
        ...extraction.uncertainty_notes,
        ...jobRequirements.uncertainty_notes,
        ...match.uncertainty_notes,
      ])
    ),
    model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
    prompt_version: [
      RESUME_EXTRACTION_PROMPT_VERSION,
      JOB_REQUIREMENTS_PROMPT_VERSION,
      CANDIDATE_MATCH_PROMPT_VERSION,
      RECOMMENDATION_PROMPT_VERSION,
      INTERVIEW_QUESTIONS_PROMPT_VERSION,
    ].join("+"),
    evaluation_version: EVALUATION_VERSION,
    evaluated_at: new Date().toISOString(),
  };
}
