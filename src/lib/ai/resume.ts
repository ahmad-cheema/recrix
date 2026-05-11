import "server-only";

import { AppError } from "@/lib/auth/errors";
import { requestOpenAiJson } from "./openai";
import { RESUME_PARSE_PROMPT } from "./prompts/resume-parse";
import { SCORE_APPLICATION_PROMPT } from "./prompts/score-application";

export type ParsedResume = {
  name: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  work_experience: Array<{
    company: string | null;
    title: string | null;
    duration: string | null;
    description: string | null;
  }>;
  education: string[];
  certifications: string[];
};

export type JobSummary = {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[] | null;
};

export async function parseResumeText(text: string): Promise<ParsedResume> {
  const messages = [
    { role: "system" as const, content: RESUME_PARSE_PROMPT },
    { role: "user" as const, content: text },
  ];

  const result = await requestOpenAiJson<ParsedResume>(messages);

  if (!result || !Array.isArray(result.skills)) {
    throw new AppError("INTERNAL_ERROR", "Invalid resume parse output.", 500);
  }

  return result;
}

export async function scoreApplication(
  parsedResume: ParsedResume,
  job: JobSummary
): Promise<{ score: number; riskEvaluation: string }> {
  const messages = [
    { role: "system" as const, content: SCORE_APPLICATION_PROMPT },
    {
      role: "user" as const,
      content: JSON.stringify({ resume: parsedResume, job }),
    },
  ];

  const result = await requestOpenAiJson<{
    score: number;
    riskEvaluation: string;
  }>(messages);

  if (!result) {
    throw new AppError("INTERNAL_ERROR", "Invalid score output.", 500);
  }

  const score = Number.isFinite(result.score)
    ? Math.min(100, Math.max(0, Math.round(result.score)))
    : 0;
  const riskEvaluation = result.riskEvaluation?.trim();

  if (!riskEvaluation) {
    throw new AppError("INTERNAL_ERROR", "Invalid score output.", 500);
  }

  return { score, riskEvaluation };
}
